package edu.upenn.cis.nets2120.hw3;

import java.util.Map;
import java.util.Set;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.PrintWriter;
import java.sql.SQLException;

import edu.upenn.cis.nets2120.hw3.mysql.DatabaseAccess;
import edu.upenn.cis.nets2120.hw3.mysql.DatabaseManager;

// my imports
import java.util.HashMap;
import java.util.HashSet;
import java.util.Arrays;
import java.sql.ResultSet;
import java.sql.PreparedStatement;

public class FriendsOfFriendsStreams {
    private static final Logger logger = LogManager.getLogger(FriendsOfFriendsStreams.class);
    private DatabaseAccess access = null;

    /**
     * Constructor: connect to the database. Do not modify this method.
     */
    public FriendsOfFriendsStreams() {
        System.out.println("---- Connect to MySQL -------");
        try {
            access = DatabaseManager.getDatabase();
            logger.debug("Connected!");
        } catch (Exception e) {
            logger.error("Error connecting to database: " + e.getMessage(), e);
        }
    }

    /**
     * Create the friends table on mysql. If it already exists, do nothing.
     *
     * @param connection DatabaseAccess: The connection to the database
     * @throws SQLException If the table creation fails
     */
    private void createFriendsTable(DatabaseAccess connection) throws SQLException {
        try {
            // TODO
            connection.executeSqlCommand("DROP TABLE friends");

            String command = "CREATE TABLE IF NOT EXISTS friends ( " +
            "followed VARCHAR(10), " +
            "follower VARCHAR(10), " +
            "FOREIGN KEY (followed) REFERENCES names(nconst), " +
            "FOREIGN KEY (follower) REFERENCES names(nconst))";

            connection.executeSqlCommand(command);

        } catch (SQLException e) {
            System.err.println("Error creating friends table: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Populate the friends table with friends.
     * (1) Actors should follow directors of the movies they worked for.
     * (2) Actors should follow other actors who worked with them in the same movie.
     *
     * @param connection DatabaseAccess: The connection to the database
     * @throws SQLException If the table creation fails
     */
    private void populateFriendsTable(DatabaseAccess connection) throws SQLException {
        try {
            // TODO

            String command1 = "INSERT INTO friends (followed, follower) " +
            "SELECT DISTINCT directors.nconst AS dnconst, actors.nconst AS anconst " +
            "FROM " +
            "(SELECT p.tconst AS tconst, p.nconst AS nconst FROM principals p WHERE (p.category = 'actor') OR (p.category = 'actress')) AS actors " +
            "JOIN " +
            "(SELECT p.tconst as tconst, p.nconst AS nconst FROM principals p WHERE p.category = 'director') AS directors " +
            "ON actors.tconst = directors.tconst " +
            "WHERE actors.nconst != directors.nconst";

            connection.executeSqlCommand(command1);

            String command2 = "INSERT INTO friends (followed, follower) " +
            "SELECT DISTINCT actors1.nconst AS a1nconst, actors2.nconst AS a2nconst " +
            "FROM " +
            "(SELECT p.tconst AS tconst, p.nconst AS nconst FROM principals p WHERE (p.category = 'actor') OR (p.category = 'actress')) AS actors1 " +
            "JOIN " +
            "(SELECT p.tconst AS tconst, p.nconst AS nconst FROM principals p WHERE (p.category = 'actor') OR (p.category = 'actress')) AS actors2 " +
            "ON actors1.tconst = actors2.tconst " +
            "WHERE (actors1.nconst, actors2.nconst) NOT IN (SELECT followed, follower FROM friends) AND actors1.nconst != actors2.nconst";

            connection.executeSqlCommand(command2);

        } catch (SQLException e) {
            System.err.println("Error loading friends table: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Create the recommendations table if it does not exist
     *
     * @param connection DatabaseAccess: The connection to the database
     * @throws SQLException If the table creation fails
     */
    private void createRecommendationsTable(DatabaseAccess connection) throws SQLException {
        try {
            // TODO
            connection.executeSqlCommand("DROP TABLE recommendations");

            String command = "CREATE TABLE IF NOT EXISTS recommendations ( " +
            "person VARCHAR(10), " +
            "recommendation VARCHAR(10), " +
            "strength INT, " +
            "PRIMARY KEY (person, recommendation), " +
            "FOREIGN KEY (person) REFERENCES names(nconst), " +
            "FOREIGN KEY (recommendation) REFERENCES names(nconst))";

            connection.executeSqlCommand(command);

        } catch (SQLException e) {
            System.err.println("Error creating recommendations table: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Create a map with persons and a set of everyone they follow. Limit the data you
     * work with to create the map to the first 10000 pairs when you order the
     * "followed" column in ascending order in SQL.
     *
     * @param connection DatabaseAccess: The connection to the database
     * @return Map<String, Set < String>>: (person: String, followed: Set<String>)
     */
    private Map<String, Set<String>> createFollowedMap(DatabaseAccess connection) throws SQLException {
        // TODO
        // String query = """
        // WITH subset AS (
        //     SELECT *
        //     FROM friends
        //     ORDER BY followed
        //     LIMIT 10000)
        // SELECT
        //     follower,
        //     GROUP_CONCAT(followed) AS followed_list
        // FROM subset
        // GROUP BY follower;
        // """;
        try {

            String query = "SELECT DISTINCT * FROM friends ORDER BY followed ASC LIMIT 10000";
            ResultSet resultSet = connection.executeSqlQuery(query);

            Map<String, Set<String>> output = new HashMap<>();

            while (resultSet.next()) {
                String follower = resultSet.getString("follower");
                String followed = resultSet.getString("followed");

                if (output.containsKey(follower)) {
                    Set<String> followed_list = output.get(follower);
                    followed_list.add(followed);
                    output.put(follower, followed_list);
                } else {
                    Set<String> followed_list = new HashSet<>();
                    followed_list.add(followed);
                    output.put(follower, followed_list);
                }
            }

            return output;

        } catch (SQLException e) {
            System.err.println("Error querying friends to create map: " + e.getMessage());
            throw e; 
        }
    }

    /**
     * Compute the map of recommendations and strength of the recommendations
     *
     * @param connection DatabaseAccess: The connection to the database
     * @return Map<String, Map < String, Integer>>: (person: String, (recommended: String, strength: Integer))
     */
    private Map<String, Map<String, Integer>> friendOfAFriendRecommendations(DatabaseAccess connection) throws SQLException {
        try {
            Map<String, Set<String>> followedMap = createFollowedMap(connection);

            System.out.println(followedMap.size());
            // TODO: Compute the friend-of-a-friend recommendations
            //  (1) For each person, add them to the recommendations map with an empty map of recommendations
            //  (2) For each person A that they follow, get the set of people A follows
            //  (3) For each person in the set from (2), if they are not already followed by the original person,
            //      add them to the recommendations map with a strength of 1; if they are already in the map,
            //      increment their strength by 1.
            Map<String, Map<String, Integer>> output = new HashMap<>();

            int counter = 0;

            for (Map.Entry<String, Set<String>> entry : followedMap.entrySet()) {
                String person = entry.getKey();
                Set<String> neighbors = entry.getValue();

                Map<String, Integer> recList = new HashMap<>();

                for (String neighbor : neighbors) {
                    if (followedMap.containsKey(neighbor)) {
                        Set<String> neighbors_neighbors = followedMap.get(neighbor);
                        for (String recommended : neighbors_neighbors) {
                            if (!neighbors.contains(recommended) && !person.equals(recommended)) { // if he is not already following them and they are not him
                                counter++;
                                if (recList.containsKey(recommended)) {
                                    int strength = recList.get(recommended);
                                    recList.put(recommended, strength + 1);
                                } else {
                                    recList.put(recommended, 1);
                                }
                            }
                        }
                    }
                }
                // otherwise rec list must have at least one suggestion so include it
                output.put(person, recList);
            }
            System.out.println("COUNTER: " + counter);
            System.out.println(output.size());
            return output;

        } catch (SQLException e) {
            System.err.println("Error computing map of recommendations and strengths: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Populate the recommendations table with the recommendations and strengths computed in the
     * `friendOfAFriendRecommendations` method.
     *
     * @param recommendationsMap Map<String, Map < String, Integer>>: (person: String, (recommended: String, strength: Integer))
     *                           The map of recommendations and strengths
     * @param connection         DatabaseAccess: The connection to the database
     * @throws SQLException If the table creation fails
     */
    private void sendRecommendationsToDatabase(Map<String, Map<String, Integer>> recommendationsMap,
                                               DatabaseAccess connection) throws SQLException {
        // TODO
        try {

            for (String person : recommendationsMap.keySet()) {
                Map<String, Integer> recToStrengthMap = recommendationsMap.get(person);
                for (String recommended : recToStrengthMap.keySet()) {                
                    int strength = recToStrengthMap.get(recommended);
                    
                    String command = "INSERT INTO recommendations (person, recommendation, strength) VALUES ";
                    command += "('" + person + "', '" + recommended + "', " + strength + ")";

                    PreparedStatement preparedStatement = connection.prepareStatement(command);
                    preparedStatement.executeUpdate();
                }
            }
            
        } catch (SQLException e) {
            System.err.println("Error creating recommendations table: " + e.getMessage());
            throw e;
        }        
    }

    /**
     * Write the recommendations to a CSV file. Do not modify this method.
     *
     * @param recommendationsMap Map<String, Map < String, Integer>>: (person: String, (recommended: String, strength: Integer))
     *                           The map of recommendations and strengths
     */
    public void writeResultsCsv(Map<String, Map<String, Integer>> recommendationsMap) {
        try {
            PrintWriter writer = new PrintWriter("recommendations.csv");
            recommendationsMap.forEach((person, foFs) -> {
                foFs.forEach((recommendation, strength) -> {
                    writer.write(person + "," + recommendation + "," + strength + "\n");
                    System.out.println(person + " " + recommendation);
                });
            });
            writer.close();
        } catch (Exception e) {
            logger.error("An error occurred while writing to CSV: " + e.getMessage(), e);
        }
    }

    /**
     * Main functionality in the program: read and process the network. Do not modify this method.
     */
    public void run() throws SQLException {
        // First time changes
        try {
            access.executeSqlCommandSilent("ALTER TABLE names MODIFY COLUMN nconst VARCHAR(10);");
            access.executeSqlCommandSilent("CREATE INDEX idx_nconst ON names(nconst);");
            // access.executeSqlCommandSilent("alter table names add column nconst_short varchar(10);");
            // access.executeSqlCommandSilent("update names set nconst_short=nconst;");
            // access.executeSqlCommandSilent("alter table names add primary key (nconst_short);");
        } catch (SQLException e) {
            // We'll silently fail on this error because it means the column was already added
        }

        // Create and populate the friends table
        createFriendsTable(access);
        populateFriendsTable(access);

        // Create and populate the recommendations table
        createRecommendationsTable(access);
        Map<String, Map<String, Integer>> recommendations = friendOfAFriendRecommendations(access);
        if (recommendations == null) {
            logger.error("Recommendations are null");
            return;
        }
        System.out.println(recommendations.size());
        writeResultsCsv(recommendations);
        sendRecommendationsToDatabase(recommendations, access);
    }

    public static void main(String[] args) {
        FriendsOfFriendsStreams fs = new FriendsOfFriendsStreams();

        try {
            fs.run();
        } catch (SQLException e) {
            logger.error("SQL error occurred: " + e.getMessage(), e);
        }
    }
}
