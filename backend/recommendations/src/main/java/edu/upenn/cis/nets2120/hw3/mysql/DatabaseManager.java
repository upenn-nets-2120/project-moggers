package edu.upenn.cis.nets2120.hw3.mysql;

import edu.upenn.cis.nets2120.config.Config;

/**
 * An example of a manager for a "singleton" database connection.
 * From this we'll get a DatabaseAccess object that lets us execute
 * SQL commands (like INSERT or CREATE TABLE) and queries (like SELECT).
 * <p>
 * We want to use the <a href="https://refactoring.guru/design-patterns/singleton">*singleton* design pattern</a>
 * so we can, for instance, put a "mock object" to emulate the database connection.
 */
public class DatabaseManager {
    static DatabaseAccess theDatabase = null;

    public static DatabaseAccess getDatabase() {
        if (theDatabase == null) {
            try {
                theDatabase = new DatabaseAccess(Config.DATABASE_CONNECTION, Config.DATABASE_USERNAME, Config.DATABASE_PASSWORD);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return theDatabase;
    }

    public static void setDatabase(DatabaseAccess db) {
        theDatabase = db;
    }
}
