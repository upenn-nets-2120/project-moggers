package edu.upenn.cis.nets2120.hw3;

import java.io.IOException;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.SQLException;
import java.sql.PreparedStatement;

import scala.Tuple2;

import java.util.*;
import java.lang.Math;

public class ComputeRanks extends SparkJob<List<Tuple2<String, Tuple2<String, Double>>>> {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(ComputeRanks.class);

    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations
    int max_answers = 1000;

    public ComputeRanks(double d_max, int i_max, int answers, boolean debug) {
        super(true, true, debug);
        this.d_max = d_max;
        this.i_max = i_max;
        this.max_answers = answers;
    }

    /**
     * Fetch the social network from the S3 path, and create a (followed, follower)
     * edge graph
     *
     * @param filePath
     * @return JavaPairRDD: (followed: String, follower: String)
     */
    protected JavaPairRDD<String, String> getSocialNetwork(String filePath) {
        JavaRDD<String> file = context.textFile(filePath, Config.PARTITIONS);

        // TODO Load the file filePath into an RDD (take care to handle both spaces and
        // tab characters as separators)

        JavaPairRDD<String, String> socialNetwork = file.mapToPair(row -> {
            // split based on spaces and tabs
            String[] edge = row.split("[\\s\t]+", 2);

            String follower = edge[0];
            String followed = edge[1];

            return new Tuple2<>(followed, follower);
        });

        socialNetwork = socialNetwork.distinct();

        return socialNetwork;
    }

    /**
     * Retrieves the sinks in the provided graph.
     *
     * @param network The input graph represented as a JavaPairRDD.
     * @return A JavaRDD containing the nodes with no outgoing edges.
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Find the sinks in the provided graph
        JavaRDD<String> followed = network.keys(); // set of all people who could not be sinks
        JavaRDD<String> followers = network.values(); // set of all people who could be sinks

        JavaRDD<String> sinks = followed.subtract(followers).distinct();

        return sinks;
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRank algorithm to compute the ranks of nodes in a social network.
     *
     * @param debug a boolean value indicating whether to enable debug mode
     * @return a list of tuples containing the node ID and its corresponding SocialRank value
     * @throws IOException          if there is an error reading the social network data
     * @throws InterruptedException if the execution is interrupted
     */
    public List<Tuple2<String, Tuple2<String, Double>>> run(boolean debug) throws IOException, InterruptedException {

        // Estbalish connection to database
        Connection conn; 
        Statement stmt;
        try {
            initializeTables();
            conn = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD);
            stmt = conn.createStatement();
        } catch (SQLException e) {
            e.printStackTrace();
            return new ArrayList<>();
        }

        // USERS
        // Making (u,u) edges
        String q1 = "SELECT * FROM friends";
        List<Tuple2<String, String>> friendsEdgesList = new ArrayList<>();
        JavaPairRDD<String, String> friendsEdges = null;
        try {
            ResultSet temp = stmt.executeQuery(q1);
            while (temp.next()) {
                String follower = "user:" + Integer.toString(temp.getInt("follower"));
                String followed = "user:" + Integer.toString(temp.getInt("followed"));
                friendsEdgesList.add(new Tuple2<>(follower, followed));
            }
            friendsEdges = context.parallelizePairs(friendsEdgesList).mapToPair(x -> new Tuple2<>(x._1(), x._2()));
            // friendsEdges.foreach(x -> System.out.println(x._1() + " " + x._2()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        JavaPairRDD<String, Integer> friendsCounts = friendsEdges.mapValues(x -> 1).reduceByKey((x, y) -> x + y);
        JavaPairRDD<String, Double> friendsTransfer = friendsCounts.mapValues(x -> 0.3 / x);
        JavaPairRDD<String, Tuple2<String, Double>> friendEdgeWeights = friendsEdges.join(friendsTransfer);

        // making edges between users and liked posts
        String q2 = "SELECT * FROM likes";
        List<Tuple2<String, String>> likesEdgesList = new ArrayList<>();
        JavaPairRDD<String, String> likesEdges = null;
        try {
            ResultSet temp = stmt.executeQuery(q2);
            while (temp.next()) {
                String user = "user:" + Integer.toString(temp.getInt("user_id"));
                String post = "post:" + Integer.toString(temp.getInt("post_id"));
                likesEdgesList.add(new Tuple2<>(user, post));
            }
            likesEdges = context.parallelizePairs(likesEdgesList);
            // likesEdges.foreach(x -> System.out.println(x._1() + " " + x._2()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        JavaPairRDD<String, Integer> likesCounts = likesEdges.mapValues(x -> 1).reduceByKey((x, y) -> x + y);
        JavaPairRDD<String, Double> likesTransfer = likesCounts.mapValues(x -> 0.4 / x);
        JavaPairRDD<String, Tuple2<String, Double>> likesEdgeWeights = likesEdges.join(likesTransfer);

        // making edges between users and hashtags
        String q3 = "SELECT * FROM hashtags";
        List<Tuple2<String, String>> userhashtagsEdgesList = new ArrayList<>();
        JavaPairRDD<String, String> userhashtagsEdges = null;
        try {
            ResultSet temp = stmt.executeQuery(q3);
            while (temp.next()) {
                String user = "user:" + Integer.toString(temp.getInt("user_id"));
                String hashtag = "hashtag:" + temp.getString("name");
                userhashtagsEdgesList.add(new Tuple2<>(user, hashtag));
            }
            userhashtagsEdges = context.parallelizePairs(userhashtagsEdgesList);
            // userhashtagsEdges.foreach(x -> System.out.println(x._1() + " " + x._2()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        JavaPairRDD<String, Integer> userhashtagsCounts = userhashtagsEdges.mapValues(x -> 1).reduceByKey((x, y) -> x + y);
        JavaPairRDD<String, Double> userhashtagsTransfer = userhashtagsCounts.mapValues(x -> 0.3 / x);
        JavaPairRDD<String, Tuple2<String, Double>> userhashtagsEdgeWeights = userhashtagsEdges.join(userhashtagsTransfer);

        JavaPairRDD<String, String> hashtaguserEdges = userhashtagsEdges.mapToPair(x -> new Tuple2<>(x._2(), x._1()));
        JavaPairRDD<String, Integer> hashtaguserCounts = hashtaguserEdges.mapValues(x -> 1).reduceByKey((x, y) -> x + y);
        JavaPairRDD<String, Double> hashtaguserTransfer = hashtaguserCounts.mapValues(x -> 0.3 / x);
        JavaPairRDD<String, Tuple2<String, Double>> hashtaguserEdgeWeights = hashtaguserEdges.join(hashtaguserTransfer);

        // making edges between posts and hashtags
        String q4 = "SELECT * FROM hashtagPosts";
        List<Tuple2<String, String>> posthashtagsEdgesList = new ArrayList<>();
        JavaPairRDD<String, String> posthashtagsEdges = null;
        try {
            ResultSet temp = stmt.executeQuery(q4);
            while (temp.next()) {
                String post = "post:" + Integer.toString(temp.getInt("hashID"));
                String hashtag = "hashtag:" + temp.getString("name");
                posthashtagsEdgesList.add(new Tuple2<>(post, hashtag));
            }
            posthashtagsEdges = context.parallelizePairs(posthashtagsEdgesList);
            // posthashtagsEdges.foreach(x -> System.out.println(x._1() + " " + x._2()));
        } catch (Exception e) {
            e.printStackTrace();
        }
        JavaPairRDD<String, Tuple2<String, Double>> posthashtagsEdgeWeights = posthashtagsEdges.mapToPair(x -> new Tuple2<>(x._1(), new Tuple2<>(x._2(), 1.0)));


        // Combine all edges
        JavaPairRDD<String, Tuple2<String, Double>> edges = friendEdgeWeights
                                                                .union(likesEdgeWeights)
                                                                .union(userhashtagsEdgeWeights)
                                                                .union(hashtaguserEdgeWeights)
                                                                .union(posthashtagsEdgeWeights);

        // edges.foreach(x -> System.out.println(x._1() + " " + x._2()._1() + " " + x._2()._2()));

        // users
        JavaPairRDD<String, Tuple2<String, Double>> nodes = userhashtagsCounts.mapToPair(x -> new Tuple2<>(x._1(), new Tuple2<>(x._1(), 1.0)));
        // this one we will not change
        JavaPairRDD<Tuple2<String, String>, Double> usersConstant = nodes.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1(), x._1()), 1.0));
        // this one we will change weights
        JavaPairRDD<Tuple2<String, String>, Double> usersChanging = nodes.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1(), x._1()), 1.0));

        // perform adsorption
        for (int i = 0; i < 15; i++) {
            JavaPairRDD<String, Tuple2<Tuple2<String, Double>, Tuple2<String, Double>>> prop = nodes.join(edges);
	    	JavaPairRDD<String, Tuple2<String, Double>> newNodes = prop.mapToPair(x -> new Tuple2<>
	    		(x._2._2._1, new Tuple2<>(x._2._1._1,x._2._1._2 * x._2._2._2)));

            JavaPairRDD<String, Double> extractDouble = newNodes.mapToPair(x -> new Tuple2<>(x._1(), x._2()._2()));
            JavaPairRDD<String, Double> sumWeights = extractDouble.reduceByKey((x, y) -> x + y);
            JavaPairRDD<String, Tuple2<Tuple2<String, Double>, Double>> newNodesWithSum = newNodes.join(sumWeights);
            newNodes = newNodesWithSum.mapToPair(x -> new Tuple2<>(x._1(), new Tuple2<>(x._2()._1()._1(), x._2()._1()._2() / x._2()._2())));
            JavaPairRDD<Tuple2<String, String>, Double> newNodesChanging = newNodes.mapToPair(x -> new Tuple2<>(new Tuple2<>(x._1(), x._2()._1()), x._2()._2()));

            newNodesChanging = newNodesChanging.reduceByKey((x, y) -> x + y);
            newNodesChanging = newNodesChanging.subtractByKey(usersConstant);
            newNodesChanging = newNodesChanging.union(usersChanging);

            Double maxDiff = newNodesChanging.join(usersChanging).mapToDouble(x -> Math.abs(x._2()._1() - x._2()._2())).max(Comparator.naturalOrder());

            if (maxDiff < 0.15) {
                break;
            }

            usersChanging = newNodesChanging;

            newNodes = newNodesChanging.mapToPair(x -> new Tuple2<>(x._1()._1(), new Tuple2<>(x._1()._2(), x._2())));

            nodes = newNodes;
        }

        nodes = nodes.join(posthashtagsEdges).mapToPair(x -> new Tuple2<>(x._1(), new Tuple2<>(x._2()._1()._1(), x._2()._1()._2())));
        nodes = nodes.mapToPair(x -> new Tuple2<>(x._1(), new Tuple2<>(x._2()._1(), x._2()._2())));
        // writeToTable(nodes);
        List<Tuple2<String, Tuple2<String, Double>>> output = new ArrayList<>(); 
        nodes.foreach(x -> output.add(new Tuple2<>(x._1(), new Tuple2<>(x._2()._1(), x._2()._2()))));
        return output;
    }

    void writeToTable(JavaPairRDD<String, Tuple2<String, Double>> results) {
        results.foreach(row -> {
            try (Connection conn = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD)) {
                PreparedStatement stmt = conn.prepareStatement("INSERT INTO adsoprtion VALUES (?, ?, ?)");

                int post_id = Integer.parseInt(row._1().split(":")[1]);
                int user_id = Integer.parseInt(row._2()._1().split(":")[1]);
                double weight = row._2()._2();

                stmt.setInt(1, user_id);
                stmt.setInt(2, post_id);
                stmt.setDouble(3, weight);

                stmt.executeUpdate();

            } catch (SQLException e) {
                e.printStackTrace();
            }
        });
    }

    void initializeTables() throws SQLException {
        try (Connection conn = DriverManager.getConnection(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD)) {
            Statement stmt = conn.createStatement();
            stmt.executeUpdate("CREATE TABLE IF NOT EXISTS adsorption (user_id INT, post_id INT, weight DOUBLE, PRIMARY KEY (user_id, post_id))");
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}