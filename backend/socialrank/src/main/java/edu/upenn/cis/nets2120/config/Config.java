package edu.upenn.cis.nets2120.config;

/**
 * Global configuration for NETS 2120 homeworks.
 *
 * @author zives
 */
public class Config {

    // For test drivers
    public static void setSocialPath(String path) {
        SOCIAL_NET_PATH = path;
    }

    /**
     * The path to the space-delimited social network data
     */
    public static String SOCIAL_NET_PATH = "s3a://penn-cis545-files/movie_friends.txt";

    public static String SIMPLE_EXAMPLE_PATH = "/nets2120/homework-3-ms2-Haokius/src/main/java/edu/upenn/cis/nets2120/hw3/simple-example.txt";

    public static String LOCAL_SPARK = "local[*]";

    public static String JAR = "target/nets2120-hw3-0.0.1-SNAPSHOT.jar";

    // these will be set via environment variables
    public static String ACCESS_KEY_ID = System.getenv("AWS_ACCESS_KEY_ID");
    public static String SECRET_ACCESS_KEY = System.getenv("AWS_SECRET_ACCESS_KEY");
    public static String SESSION_TOKEN = System.getenv("AWS_SESSION_TOKEN");

    // RDS database connection
    public static String DATABASE_CONNECTION = "jdbc:mysql://localhost:3306/imdbdatabase";
    public static String DATABASE_USERNAME = "admin";
    public static String DATABASE_PASSWORD = "rds-password";

    /**
     * How many RDD partitions to use?
     */
    public static int PARTITIONS = 5;
}
