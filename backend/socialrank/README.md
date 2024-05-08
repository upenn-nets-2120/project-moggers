You can pretty much ignore all other things except the following:

ComputeRanks.java - run(), writeToTable() and initializeTables()
Config file
ComputeRanksLocal

Additionally, make sure to source .env

To do adsorption, run the following: mvn exec:java@local -Dexec.args="30 25 false"

The actual input doesn't matter, everything is hard coded in.
