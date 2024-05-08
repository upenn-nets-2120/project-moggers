package edu.upenn.cis.nets2120.hw3.mysql;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Database connection management layer -- constructor creates a connection
 * to the database, and then we can query or execute statements against it
 */
public class DatabaseAccess {
    private static final Logger logger = LogManager.getLogger(DatabaseAccess.class);
    Connection connection = null;

    // Initialize the connection
    public DatabaseAccess(String url, String user, String password) throws Exception {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (Exception ex) {
            // handle the error
            logger.error("Error: " + ex.getMessage());
            System.exit(1);
        }

        try {
            connection = DriverManager.getConnection(url, user, password);
        } catch (SQLException e) {
            logger.error("Connection to database failed! Please make sure the RDS server is correct, the tunnel is enabled, and you have run the mysql command to create the database:\n" + e.getMessage());
            System.exit(1);
        }
    }

    /**
     * If we really want the SQL connection
     *
     * @return
     */
    public Connection getConnection() {
        return connection;
    }

    /**
     * Execute an SQL command that doesn't return anything. This version
     * traps and prints an error when there is an exception.
     *
     * @param command
     * @throws SQLException
     */
    public void executeSqlCommand(String command) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.execute(command);
        } catch (SQLException e) {
            logger.error("Error executing: " + command);
            logger.error("Error: " + e.getMessage());
            throw e;
        }
    }

    /**
     * Execute an SQL command that doesn't return anything. This version
     * doesn't trap exceptions (it's 'silent').
     *
     * @param command
     * @throws SQLException
     */
    public void executeSqlCommandSilent(String command) throws SQLException {
        Statement statement = connection.createStatement();
        statement.execute(command);
    }

    /**
     * Expose prepared statements
     */
    public PreparedStatement prepareStatement(String sql) throws SQLException {
        return this.connection.prepareStatement(sql);
    }

    /**
     * Execute an SQL query and get back the result set
     *
     * @param query
     * @return
     * @throws SQLException
     */
    public ResultSet executeSqlQuery(String query) throws SQLException {
        Statement stmt = connection.createStatement();
        return stmt.executeQuery(query);
    }
}
