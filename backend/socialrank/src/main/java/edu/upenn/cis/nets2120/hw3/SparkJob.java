package edu.upenn.cis.nets2120.hw3;

import java.io.File;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.concurrent.ExecutionException;

import org.apache.livy.Job;
import org.apache.livy.JobContext;
import org.apache.livy.LivyClient;
import org.apache.livy.LivyClientBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.spark.api.java.JavaSparkContext;
import org.apache.spark.sql.SparkSession;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.engine.SparkConnector;

/**
 * A basic Spark job with session info, initialize, shutdown, and run methods
 */
public abstract class SparkJob<T> implements Job<T> {
    private static final long serialVersionUID = 1L;
    /**
     * The basic logger
     */
    static Logger logger = LogManager.getLogger(SparkJob.class);

    /**
     * Connection to Apache Spark
     */
    protected SparkSession spark;
    protected JavaSparkContext context;

    protected boolean useLogger = true;
    protected boolean isLocal = true;
    boolean run_with_debug = false;

    public SparkJob(boolean isLocal, boolean useLogger, boolean debug) {
        System.setProperty("file.encoding", "UTF-8");
        this.useLogger = useLogger;
        this.isLocal = isLocal;
        this.run_with_debug = debug;
    }

    /**
     * Initialize the connection to Spark
     *
     * @throws IOException
     * @throws InterruptedException
     */
    public void initialize() throws IOException, InterruptedException {
        logger.info("Connecting to Spark...");

        spark = SparkConnector.getSparkConnection();
        context = SparkConnector.getSparkContext();

        debug("Connected!");
    }

    /**
     * Main functionality in the program: read and process the social network
     *
     * @throws IOException          File read, network, and other errors
     * @throws InterruptedException User presses Ctrl-C
     */
    public abstract T run(boolean debug) throws Exception;

    /**
     * Graceful shutdown
     */
    public void shutdown() {
        info("Shutting down");

        if (isLocal && spark != null)
            spark.close();
    }

    protected void info(String message) {
        if (useLogger)
            logger.info(message);
        else
            System.out.println(message);
    }

    protected void debug(String message) {
        if (useLogger)
            logger.debug(message);
        else
            System.out.println(message);
    }

    /**
     * Initialize - run loop that catches errors and shuts down
     */
    public T mainLogic() {
        if (!isLocal)
            throw new RuntimeException("mainLogic() should not be called on a Livy Job");

        try {
            initialize();

            return run(run_with_debug);
        } catch (final IOException ie) {
            if (useLogger)
                logger.error("I/O error: ");
            else
                System.out.print("I/O error: ");
            ie.printStackTrace();
            return null;
        } catch (final Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            shutdown();
        }
    }

    @Override
    public T call(JobContext arg0) throws Exception {
        initialize();
        return run(run_with_debug);
    }

    /**
     * Gets the URL for Livy, in most cases from the environment.
     *
     * @param optArgs -- optional command-line args from main()
     * @return URL
     */
    public static String getLivyUrl(String[] optArgs) {
        String livy = "http://localhost:8998";

        if (optArgs.length > 0) {
            livy = optArgs[0];
        } else if (System.getenv("host") != null) {
            livy = System.getenv("LIVY_HOST");
        }

        if (!livy.startsWith("http://"))
            livy = "http://" + livy;

        if (!livy.endsWith(":8998"))
            livy = livy + ":8998";

        return livy;
    }

    /**
     * Static method to run a SparkJob remotely at a Livy URL.
     * Will create the Livy client, upload the JAR, and run the job.
     *
     * @param <T>
     * @param livyUrl
     * @param job
     * @return
     * @throws IOException
     * @throws URISyntaxException
     * @throws InterruptedException
     * @throws ExecutionException
     */
    public static <T> T runJob(String livyUrl, SparkJob<T> job) throws IOException, URISyntaxException, InterruptedException, ExecutionException {

        LivyClient client = new LivyClientBuilder()
                .setURI(new URI(livyUrl))
                .build();

        try {
            String jar = Config.JAR;

            System.out.printf("Uploading %s to the Spark context...\n", jar);
            client.uploadJar(new File(jar)).get();

            System.out.printf("Running job...\n");
            T result = client.submit(job).get();

            return result;
        } finally {
            client.stop(true);
        }
    }
}
