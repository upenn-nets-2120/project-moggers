package edu.upenn.cis.nets2120.hw3.livy;

import java.io.IOException;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;

import org.apache.livy.JobContext;
import org.apache.spark.api.java.JavaPairRDD;
import org.apache.spark.api.java.JavaRDD;

import edu.upenn.cis.nets2120.config.Config;
import edu.upenn.cis.nets2120.hw3.SparkJob;
import scala.Tuple2;

public class SocialRankJob extends SparkJob<List<MyPair<String, Double>>> {
    /**
     *
     */
    private static final long serialVersionUID = 1L;

    private boolean useBacklinks;
    // Convergence condition variables
    protected double d_max; // largest change in a node's rank from iteration i to iteration i+1
    protected int i_max; // max number of iterations

    private String source;

    int max_answers = 1000;

    public SocialRankJob(double d_max, int i_max, int answers, boolean useBacklinks, boolean debug) {
        super(false, false, debug);
        this.useBacklinks = useBacklinks;
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

        // TODO Your code from ComputeRanks here

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
     * Retrieves the sinks from the given network.
     *
     * @param network the input network represented as a JavaPairRDD
     * @return a JavaRDD containing the nodes with no outgoing edges (sinks)
     */
    protected JavaRDD<String> getSinks(JavaPairRDD<String, String> network) {
        // TODO Your code from ComputeRanks here

        JavaRDD<String> followed = network.keys(); // set of all people who could not be sinks
        JavaRDD<String> followers = network.values(); // set of all people who could be sinks

        JavaRDD<String> sinks = followed.subtract(followers).distinct();

        return sinks;
    }

    /**
     * Main functionality in the program: read and process the social network
     * Runs the SocialRankJob and returns a list of the top 10 nodes with the highest SocialRank values.
     *
     * @param debug a boolean indicating whether to enable debug mode
     * @return a list of MyPair objects representing the top 10 nodes with their corresponding SocialRank values
     * @throws IOException          if there is an error reading the social network file
     * @throws InterruptedException if the execution is interrupted
     */
    public List<MyPair<String, Double>> run(boolean debug) throws IOException, InterruptedException {
        System.out.println("Running");

        // Load the social network, aka. the edges (followed, follower)
        JavaPairRDD<String, String> edgeRDD = getSocialNetwork(Config.SOCIAL_NET_PATH);

        // Find the sinks in edgeRDD as PairRDD
        JavaRDD<String> sinks = getSinks(edgeRDD);
        System.out.println("There are " + sinks.count() + " sinks");

        // TODO: Your code from ComputeRanks here
        
        // PART 1
        // convert sinks into a javapairRDD where value is empty string
        JavaPairRDD<String, String> sinksPair = sinks.mapToPair(key -> new Tuple2<>(key, ""));
        // these are the backlinks
        JavaPairRDD<String, String> backlinks = edgeRDD.join(sinksPair)
                                                        .mapToPair(pair -> new Tuple2<>(pair._2()._1(), pair._1()));
        // add backlinks
        JavaPairRDD<String, String> socialNetwork = edgeRDD.union(backlinks).distinct().mapToPair(pair -> pair.swap());

        // System.out.println(backlinks.count());
        // System.out.println(socialNetwork.count());

        // PART 2
        JavaPairRDD<String, Double> nodeTransferRDD = socialNetwork.mapToPair(pair -> new Tuple2<>(pair._1(), 1.0)).reduceByKey(Double::sum);
        nodeTransferRDD = nodeTransferRDD.mapToPair(pair -> new Tuple2<>(pair._1(), 1 / pair._2()));
        // print debugging
        // nodeTransferRDD.foreach(pair -> System.out.println(pair._1() + " " + pair._2()));
        // System.out.println("AHAHAHAHAHA");

        JavaPairRDD<String, Tuple2<String, Double>> edgeTransferRDD = socialNetwork.join(nodeTransferRDD);

        JavaPairRDD<String, Double> pageRankRDD = socialNetwork.mapToPair(pair -> new Tuple2<>(pair._1(), 1.0)).distinct();

        // System.out.println(pageRankRDD.count());

        for (int i = 0; i < i_max; i++) {
            // updating pagerank values
            JavaPairRDD<String, Double> propagateRdd = edgeTransferRDD.join(pageRankRDD).mapToPair(pair -> new Tuple2<>(pair._2()._1()._1(), pair._2()._1()._2() * pair._2()._2()));
            propagateRdd = propagateRdd.reduceByKey(Double::sum);
            propagateRdd = propagateRdd.mapToPair(pair -> new Tuple2<>(pair._1(), 0.15 + 0.85 * pair._2()));
            // pageRankRDD.foreach(pair -> System.out.println(pair._1() + " " + pair._2()));

            // calculating max_values to check for convergence
            JavaPairRDD<String, Double> diffRDD = propagateRdd.join(pageRankRDD).mapToPair(pair -> new Tuple2<>(pair._1(), Math.abs(pair._2()._1() - pair._2()._2())));
            pageRankRDD = propagateRdd;
            
            Double max_value = diffRDD.values().reduce((x, y) -> Math.max(x, y));
            if (max_value < d_max) {
                break;
            }
        }

        // now output the top 1000 results
        JavaPairRDD<Double, String> pageRankOrdered = pageRankRDD.mapToPair(pair -> pair.swap()).sortByKey(false);
        List<Tuple2<String, Double>> outputTuple2 = pageRankOrdered.mapToPair(pair -> pair.swap()).take(1000);

        List<MyPair<String, Double>> output = new LinkedList<>();
        for (Tuple2<String, Double> pair : outputTuple2) {
            output.add(new MyPair(pair._1(), pair._2()));
        }

        return output;

    }

    @Override
    public List<MyPair<String, Double>> call(JobContext arg0) throws Exception {
        initialize();
        return run(false);
    }

}
