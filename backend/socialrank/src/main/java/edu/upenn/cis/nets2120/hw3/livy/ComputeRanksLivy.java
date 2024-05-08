package edu.upenn.cis.nets2120.hw3.livy;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import edu.upenn.cis.nets2120.hw3.SparkJob;
import edu.upenn.cis.nets2120.hw3.ComputeRanks;
import scala.Tuple2;

import java.util.LinkedList;

/**
 * The `ComputeRanksLivy` class is responsible for running a social network ranking job using Apache Livy.
 * It takes command line arguments to configure the job parameters and performs the following tasks:
 * 1. Runs a SocialRankJob with backlinks set to true and writes the output to a file named "socialrank-livy-backlinks.csv".
 * 2. Runs a SocialRankJob with backlinks set to false and writes the output to a file named "socialrank-livy-nobacklinks.csv".
 * 3. Compares the top-10 results from both runs and writes the comparison to a file named "socialrank-livy-results.txt".
 * <p>
 * The class uses the Apache Livy library to submit and execute the jobs on a Livy server.
 * It also uses the SparkJob class to run the SocialRankJob and obtain the results.
 * <p>
 * To run the job, the `LIVY_HOST` environment variable must be set. If not set, the program will exit with an error message.
 */
public class ComputeRanksLivy {
    static Logger logger = LogManager.getLogger(ComputeRanksLivy.class);

    public static void main(String[] args)
            throws IOException, URISyntaxException, InterruptedException, ExecutionException {
        boolean debug;

        double d_max;
        int i_max;

        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("LIVY_HOST") == null) {
            logger.error("LIVY_HOST not set -- update your .env and run source .env");
            System.exit(-1);
        }

        // Process command line arguments if given
        if (args.length == 1) {
            d_max = Double.parseDouble(args[0]);
            i_max = 25;
            debug = false;
        } else if (args.length == 2) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = false;
        } else if (args.length == 3) {
            d_max = Double.parseDouble(args[0]);
            i_max = Integer.parseInt(args[1]);
            debug = true;
        } else {
            d_max = 30;
            i_max = 25;
            debug = false;
        }

        String livy = SparkJob.getLivyUrl(args);

        // Below is a call to Apache Livy to run a SocialRankJob with backlinks = false.
        // This part is already done for you.
        SocialRankJob blJob = new SocialRankJob(d_max, i_max, 1000, true, debug);

        List<MyPair<String, Double>> backlinksResult = SparkJob.runJob(livy, blJob);
        System.out.println("With backlinks: " + backlinksResult);
        try (PrintStream out = new PrintStream(new FileOutputStream("socialrank-livy-backlinks.csv"))) {
            for (MyPair<String, Double> item : backlinksResult) {
                out.println(item.getLeft() + "," + item.getRight());
            }
        } catch (Exception e) {
            logger.error("Error writing to file: " + e.getMessage());
        }

        // TODO: Add a second call to Apache Livy to run a SocialRankJob with the
        // back-links set to false. Write the output to a file named
        // "socialrank-livy-nobacklinks.csv"

        SocialRankJob blfJob = new SocialRankJob(d_max, i_max, 1000, false, debug);
        List<MyPair<String, Double>> backlinksFalseResult = SparkJob.runJob(livy, blfJob);
        System.out.println("Without backlinks: " + backlinksFalseResult);
        try (PrintStream out = new PrintStream(new FileOutputStream("socialrank-livy-nobacklinks.csv"))) {
            for (MyPair<String, Double> item : backlinksFalseResult) {
                out.println(item.getLeft() + "," + item.getRight());
            }
        } catch (Exception e) {
            logger.error("Error writing to file: " + e.getMessage());
        }

        // TODO: Compare the two sets of returned top-10 results (with and without
        // backlinks) and write to "socialrank-livy-results.txt"

        Set<String> backlinksTopTen = backlinksResult.stream().limit(10).map(pair -> pair.getLeft()).collect(Collectors.toSet());
        Set<String> backlinksFalseTopTen = backlinksFalseResult.stream().limit(10).map(pair -> pair.getLeft()).collect(Collectors.toSet());

        List<String> commonNodes = new LinkedList<>();
        List<String> exclusiveWithBacklinks = new LinkedList<>();
        List<String> exclusiveWithoutBacklinks = new LinkedList<>();

        for (String string : backlinksTopTen) {
            if (backlinksFalseTopTen.contains(string)) {
                commonNodes.add(string);
            } else {
                exclusiveWithBacklinks.add(string);
            }
        }

        for (String string : backlinksFalseTopTen) {
            if (!backlinksTopTen.contains(string)) {
                exclusiveWithoutBacklinks.add(string);
            }
        }

        try (PrintStream out = new PrintStream(new FileOutputStream("socialrank-livy-results.txt"))) {
            out.println("Nodes in both lists: " + String.join(",", commonNodes));
            out.println("Nodes exlusive with backlinks: " + String.join(",", exclusiveWithBacklinks));
            out.println("Nodes exlusive without backlinks: " + String.join(",", exclusiveWithoutBacklinks));
        } catch (Exception e) {
            logger.error("Error writing to file: " + e.getMessage());
        }

        logger.info("*** Finished social network ranking! ***");

    }

}
