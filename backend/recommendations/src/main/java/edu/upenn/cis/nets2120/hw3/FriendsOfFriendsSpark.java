package edu.upenn.cis.nets2120.hw3;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.*;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.storage.SparkConnector;
import scala.Tuple2;

// ones i added
import java.sql.ResultSet;
import java.util.ArrayList;
import java.sql.Statement;
import java.sql.PreparedStatement;

public class FriendsOfFriendsSpark {
    static Logger logger = LogManager.getLogger(FriendsOfFriendsSpark.class);

    /**
     * Connection to Apache Spark
     */
    SparkSession spark;
    JavaSparkContext context;

    public FriendsOfFriendsSpark() {
        System.setProperty("file.encoding", "UTF-8");
    }

    /**
     * Initialize the database connection. Do not modify this method.
     *
     * @throws InterruptedException User presses Ctrl-C
     */
    public void initialize() throws InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        logger.debug("Connected!");
    }

    /**
     * Fetch the social network from mysql using a JDBC connection, and create a (followed, follower) edge graph
     *
     * @return JavaPairRDD: (followed: String, follower: String) The social network
     */
    public JavaPairRDD<String, String> getSocialNetworkFromJDBC() {
        try {
            logger.info("Connecting to database...");
            Connection connection = null;

            try {
                connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                        Config.DATABASE_PASSWORD);
            } catch (SQLException e) {
                logger.error("Connection to database failed: " + e.getMessage(), e);
                logger.error("Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database.");
                System.exit(1);
            }

            if (connection == null) {
                logger.error("Failed to make connection - Connection is null");
                System.exit(1);
            }

            logger.info("Successfully connected to database!");
            // TODO: After connecting successfully, use SQL queries to get the first 10000
            //  rows of the friends table you created when sorting the `followed` column in
            //  ASC order. Then parallelize the data you get and return a JavaPairRDD object.

            Statement statement = connection.createStatement();

            String query = "SELECT DISTINCT * FROM friends ORDER BY followed ASC";
            ResultSet resultSet = statement.executeQuery(query);

            List<Tuple2<String, String>> outputList = new ArrayList<>();
            while (resultSet.next()) {
                Tuple2<String, String> tuple = new Tuple2<>(Integer.toString(resultSet.getInt("followed")), Integer.toString(resultSet.getInt("follower")));
                outputList.add(tuple);
            }

            JavaPairRDD<String, String> outputRDD = context.parallelizePairs(outputList);

            return outputRDD;

        } catch (Exception e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
        // Return a default value if the method cannot return a valid result
        return context.emptyRDD().mapToPair(x -> new Tuple2<>("", ""));
    }

    /**
     * Friend-of-a-Friend Recommendation Algorithm
     *
     * @param network JavaPairRDD: (followed: String, follower: String) The social network
     * @return JavaPairRDD: ((person, recommendation), strength) The friend-of-a-friend recommendations
     */
    private JavaPairRDD<Tuple2<String, String>, Integer> friendOfAFriendRecommendations(
            JavaPairRDD<String, String> network) {
        // TODO: Generate friend-of-a-friend recommendations by computing the set of 2nd-degree followed users. This
        //  method should do the same thing as the `friendOfAFriendRecommendations` method in the
        //  `FriendsOfFriendsStreams` class, but using Spark's RDDs instead of Java Streams.

        Set<Tuple2<String, String>> friendships = new HashSet<>();
        network.collect().forEach(friendships::add);

        // _1 of network pair is followed, _2 of network pair is follower/person
        // _1 of friends is follower, _2 of friends is followed
        JavaPairRDD<String, String> friends = network.mapToPair(pair -> new Tuple2<>(pair._2(), pair._1()));
        // inner join friends on network on the key ()
        // this here might still include key is interemediary, value is (person, rec), need to filter out for where person = rec OR rec = person's friend
        JavaPairRDD<String, Tuple2<String, String>> friendsOfFriends = friends.join(network);

        // this will filter out all the rows where the rec is the person himself
        friendsOfFriends = friendsOfFriends.filter(pair -> !pair._2()._1().equals(pair._2()._2()));

        // this will filter out all rows where the rec is already the persons friend
        friendsOfFriends = friendsOfFriends.filter(pair -> !friendships.contains(new Tuple2<String, String>(pair._2()._1(), pair._2()._2())));

        // iterate through this now and count the number of value pairs that are the same
        JavaPairRDD<Tuple2<String, String>, Integer> flippedFriendsOfFriends = friendsOfFriends.mapToPair(pair -> new Tuple2<>(new Tuple2<>(pair._2()._2(), pair._2()._1()), 1));
        JavaPairRDD<Tuple2<String, String>, Integer> output = flippedFriendsOfFriends.reduceByKey(Integer::sum);

        return output;
    }

    /**
     * Send recommendation results back to the database
     *
     * @param recommendations List: (followed: String, follower: String)
     *                        The list of recommendations to send back to the database
     */
    public void sendResultsToDatabase(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        try (Connection connection = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME,
                Config.DATABASE_PASSWORD)) {
            // TODO: Write your recommendations data back to imdbdatabase.

            // first create table if it does not already exist
            String createQuery = "CREATE TABLE recommendations (" +
            "person INT, " +
            "recommendation INT, " +
            "strength INT, " +
            "PRIMARY KEY (person, recommendation), " +
            "FOREIGN KEY (person) REFERENCES users(id), " +
            "FOREIGN KEY (recommendation) REFERENCES users(id))";

            Statement statement = connection.createStatement();
            statement.executeUpdate(createQuery);

            // then for each of the recommendations, we insert into table
            for (Tuple2<Tuple2<String, String>, Integer> recommendationTuple : recommendations) {
                int person = Integer.parseInt(recommendationTuple._1()._1());
                int recommended = Integer.parseInt(recommendationTuple._1()._2());
                int strength = recommendationTuple._2();

                String command = "INSERT INTO recommendations (person, recommendation, strength) VALUES ";
                command += "('" + person + "', '" + recommended + "', " + strength + ")";

                PreparedStatement preparedStatement = connection.prepareStatement(command);
                preparedStatement.executeUpdate();
            }

        } catch (SQLException e) {
            logger.error("Error sending recommendations to database: " + e.getMessage(), e);
        }
    }

    /**
     * Write the recommendations to a CSV file. Do not modify this method.
     *
     * @param recommendations List: (followed: String, follower: String)
     */
    public void writeResultsCsv(List<Tuple2<Tuple2<String, String>, Integer>> recommendations) {
        // Create a new file to write the recommendations to
        File file = new File("recommendations.csv");
        try (PrintWriter writer = new PrintWriter(file)) {
            // Write the recommendations to the file
            for (Tuple2<Tuple2<String, String>, Integer> recommendation : recommendations) {
                writer.println(recommendation._1._1 + "," + recommendation._1._2 + "," + recommendation._2);
            }
        } catch (Exception e) {
            logger.error("Error writing recommendations to file: " + e.getMessage(), e);
        }
    }

    /**
     * Main functionality in the program: read and process the social network. Do not modify this method.
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public void run() throws IOException, InterruptedException {
        logger.info("Running");

        // Load the social network:
        // Format of JavaPairRDD = (followed, follower)
        JavaPairRDD<String, String> network = getSocialNetworkFromJDBC();

        // Friend-of-a-Friend Recommendation Algorithm:
        // Format of JavaPairRDD = ((person, recommendation), strength)
        JavaPairRDD<Tuple2<String, String>, Integer> recommendations = friendOfAFriendRecommendations(network);

        // Collect results and send results back to database:
        // Format of List = ((person, recommendation), strength)
        if (recommendations == null) {
            logger.error("Recommendations are null");
            return;
        }
        List<Tuple2<Tuple2<String, String>, Integer>> collectedRecommendations = recommendations.collect();
        writeResultsCsv(collectedRecommendations);
        sendResultsToDatabase(collectedRecommendations);

        logger.info("*** Finished friend of friend recommendations! ***");
    }

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        logger.info("Shutting down");

        if (spark != null) {
            spark.close();
        }
    }

    public static void main(String[] args) {
        final FriendsOfFriendsSpark fofs = new FriendsOfFriendsSpark();
        try {
            while (true) {
                fofs.initialize();
                fofs.run();
                fofs.shutdown();
                // updates once every hour for everyone
                Thread.sleep(1000 * 60 * 60);
            }
        } catch (final IOException ie) {
            logger.error("IO error occurred: " + ie.getMessage(), ie);
        } catch (final InterruptedException e) {
            logger.error("Interrupted: " + e.getMessage(), e);
        } finally {
            fofs.shutdown();
        }
    }
}
