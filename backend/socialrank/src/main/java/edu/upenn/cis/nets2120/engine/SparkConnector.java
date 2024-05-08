package edu.upenn.cis.nets2120.engine;

import java.io.File;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;

public class SparkConnector {
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(SparkConnector.class);
    static SparkSession spark = null;
    static JavaSparkContext context = null;

    // Setters for testing - mock objects
    public static void setSparkSession(SparkSession s) {
        spark = s;
    }

    // Setters for testing - mock objects
    public static void setSparkContext(JavaSparkContext c) {
        context = c;
    }

    public static SparkSession getSparkConnection() {
        return getSparkConnection(null);
    }

    public static synchronized SparkSession getSparkConnection(String host) {
        if (spark == null) {
            if (System.getenv("HADOOP_HOME") == null) {
                File workaround = new File(".");

                System.setProperty("hadoop.home.dir", workaround.getAbsolutePath() + "/native-libs");
            }

            if (Config.ACCESS_KEY_ID != null) {
                logger.info("Credentials were provided, using S3");
                spark = SparkSession
                        .builder()
                        .appName("Homework3")
                        .master((host == null) ? Config.LOCAL_SPARK : host)
                        .config("spark.hadoop.fs.s3a.access.key", Config.ACCESS_KEY_ID)
                        .config("spark.hadoop.fs.s3a.secret.key", Config.SECRET_ACCESS_KEY)
                        .config("spark.hadoop.fs.s3a.session.token", Config.SESSION_TOKEN)
                        .config("spark.hadoop.fs.s3a.endpoint", "s3.us-east-1.amazonaws.com")
                        .getOrCreate();
            } else {
                logger.info("Credentials were not provided in .env: no S3 access will be available");
                spark = SparkSession
                        .builder()
                        .appName("Homework3")
                        .master((host == null) ? Config.LOCAL_SPARK : host)
                        .getOrCreate();
            }
        }

        return spark;
    }

    public static synchronized JavaSparkContext getSparkContext() {
        if (context == null)
            context = new JavaSparkContext(getSparkConnection().sparkContext());

        return context;
    }
}
