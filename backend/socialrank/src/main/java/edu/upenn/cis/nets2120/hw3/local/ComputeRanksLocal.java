package edu.upenn.cis.nets2120.hw3.local;

import edu.upenn.cis.nets2120.hw3.ComputeRanks;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import scala.Tuple2;

import java.io.FileOutputStream;
import java.io.PrintStream;
import java.util.*;

public class ComputeRanksLocal {
    static Logger logger = LogManager.getLogger(ComputeRanksLocal.class);

    public static void main(String[] args) {
        boolean debug;

        // Check so we'll fatally exit if the environment isn't set
        if (System.getenv("AWS_ACCESS_KEY_ID") == null) {
            logger.error("AWS_ACCESS_KEY_ID not set -- update your .env and run source .env");
            System.exit(-1);
        }

        double d_max;
        int i_max;

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

        ComputeRanks job = new ComputeRanks(d_max, i_max, 1000, debug);

        List<Tuple2<String, Tuple2<String, Double>>> topK = job.mainLogic();
        logger.info("*** Finished social network ranking! ***");

        try (PrintStream out = new PrintStream(new FileOutputStream("socialrank-local.csv"))) {
            for (Tuple2<String, Tuple2<String, Double>> item : topK) {
                out.println(item._1 + "," + item._2._1 + "," + item._2._2);
                logger.info(item._1 + " " + item._2._1 + " " + item._2._2);
            }
        } catch (Exception e) {
            logger.error("Error writing to file: " + e.getMessage());
        }
    }

}