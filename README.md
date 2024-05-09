# ECL-OCT-Api-load-tests
This is a load tests project for VisiECL-OCTble-API service

# K8S Automated GitHub Action Based Load tests

The following load tests exist for the purpose of running them thru Github Actions:

* [Forward label](https://github.com/Maersk-Global/ecl-oct-load-tests/actions/workflows/forward-label.yml)
* [Return label](https://github.com/Maersk-Global/ecl-oct-load-tests/actions/workflows/return-label.yml)
* [Tracking use-case by list](https://github.com/Maersk-Global/ecl-oct-load-tests/actions/workflows/tracking_list.yml)

Each of these use-cases require that the invoker supply the following common parameters:

<img width="327" alt="Screenshot 2023-10-16 at 10 38 16 AM" src="https://github.com/Maersk-Global/ecl-oct-load-tests/assets/140083932/65d85723-5f22-49bb-81f5-718763c99f76">

* Visible API Endpoint
* The ship date format: yyyy-MM-dd
* The OCT-ECL Auth Key to use
* The OCT-ECL Client Key to use
* The duration of execution in seconds (default = 30 minutes or 1800 seconds)
* The number of threads to run with (concurrent executions)

We can vary the load profile by varying the last two parameters, 30 minutes of 1800 seconds (how long), number of threads, how many requests per second.

## ⚠️Purge data before big load tests for forward and return labels
The generated data occupy a lot of space in the DB that isn't necessary to keep, while there are active jobs in place to remove data, this take weeks or months to remove them, so it is necessary to manually purge data from the database, you can use this query where it'll remove the ones with the unique identifier that has "lturifl". The database is **VisibleParcelPackageHubSandbox**.

    -- Start a transaction to enable rollback option
    BEGIN TRANSACTION;
    
    DELETE FROM indicium.ShippingLabelPostProcessingRegister
    WHERE UniqueRequestId LIKE '%lturifl%';
    
    DELETE FROM indicium.RequestResponse
    WHERE UniqueRequestId LIKE '%lturifl%';
    
    DELETE FROM indicium.ShipmentsToExport
    WHERE ShippingLicensePlate LIKE '%lturifl%';
    
    DELETE FROM indicium.CarrierRequestResponse
    WHERE UniqueRequestId LIKE '%lturifl%';
    
    COMMIT;
    
    -- If an issue occurs, rollback the transaction
    
    ROLLBACK;


To delete all load tests data in PackageHubV3 Database use the following script

You can change the TransactionSize to the size of the test. For reference, to delete 15000 records takes around 1m and 20sec

```
BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000);
    DECLARE @TransactionSize INT = 100000;

    -- Creating a temporary table to hold Shipment IDs
    SELECT TOP (@TransactionSize) ReferenceId INTO #TempShipmentIds
    FROM [Transaction]
    WHERE UserTransactionId LIKE '%lturifl%'
    ORDER BY CreatedDate DESC;

    DELETE a
    FROM Address a
    JOIN Shipment s ON a.Id = s.ToAddressId OR a.Id = s.FromAddressId
    WHERE s.Id IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE p
    FROM Package p
    JOIN ShipmentPackage sp ON p.Id = sp.PackageId
    WHERE sp.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sf
    FROM ShipmentFee sf
    JOIN ShipmentRate sr ON sf.ShipmentRateId = sr.Id
    WHERE sr.Id IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sp
    FROM ShipmentPackage sp
    WHERE sp.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE st
    FROM ShipmentTracking st
    WHERE st.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sm
    FROM ShipmentManifest sm
    WHERE sm.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sr
    FROM ShipmentRate sr
    WHERE sr.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sfm
    FROM ShipmentForm sfm
    WHERE sfm.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE sl
    FROM [ShipmentLabel] sl
    WHERE sl.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE so
    FROM ShipmentOption so
    WHERE so.ShipmentId IN (SELECT ReferenceId FROM #TempShipmentIds);

    DELETE FROM Shipment WHERE Id IN (SELECT ReferenceId FROM #TempShipmentIds);
    DELETE FROM AccountTransaction WHERE TransactionId IN (SELECT ReferenceId FROM #TempShipmentIds);
    DELETE FROM [Transaction] WHERE ReferenceId IN (SELECT ReferenceId FROM #TempShipmentIds);

    COMMIT;

    -- Dropping the temporary table
    DROP TABLE #TempShipmentIds;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK;
    SET @ErrorMessage = ERROR_MESSAGE();
    PRINT 'Error: ' + @ErrorMessage;
    -- Additional error handling as necessary
END CATCH
```


## Tracking + Label Generation: USPS Load Test

Load tests against USPS can be run during the following timeslots:

* 5:00 AM ET
* 7:00 AM ET
* 1:00 PM ET
* 6:00 PM ET

First, prior to running a load test against the sandbox environment, we must first communicate our intentions with the USPS team using the following email addresses:

```
Hazenski, Brian M - Wilkes-Barre, PA - Contractor <Brian.M.Hazenski@usps.gov>, Tillar, Maggie <margaret.tillar@afs.com>, Starvaski, Peter J - Washington, DC <Peter.J.Starvaski@usps.gov>, Donald Cross <donald.cross@maersk.com>, Tillar, Margaret <margaret.tillar@accenturefederal.com>, Ezequiel Quintero <ezequiel.quintero@maersk.com>, Hari Nayak <hari.nayak@maersk.com>
Cc: Catherine Anderson <catherine.anderson@maersk.com>, Atkin, Annette - Santa Ana, CA <annette.atkin@usps.gov>, Dittmer, Carrie L - Washington, DC <Carrie.L.Dittmer@usps.gov>, Anugrah Atreya <anugrah.atreya@maersk.com>, Magrath Jr, Douglas J - Washington, DC <Douglas.J.Magrath@usps.gov>, Betler, Evan T. <evan.t.betler@afs.com>, Wernimont, Joseph J - Washington, DC - Contractor <Joseph.J.Wernimont@usps.gov>, WB SC WebTools Analysts <WBSCWebToolsAnalysts@usps.gov>, WBIBSSC WebTools Development <WBIBSSCWebToolsDevelopment@usps.gov>
```

Please carbon-copy Hari Nayak, Manish Jha when the email is sent. Inform USPS that we will be running a load test during one of the above timeslots and that it will take place for a duration of X hours.

# Project Structure
|—— | dashboards <br />
|—— |——  k6-load-testing-results_rev3.json <br />
|—— | load_tests_scripts <br />
|—— |——  store load tests scripts in this folder <br />
|—— | helper_scripts <br />
|—— |——  general helper scripts <br />
|—— | metric_scripts <br />
|—— |——  store metrics scripts here <br />
|- .env (to be created and used to run locally)<br />
|- .gitignore <br />
|- config.json <br />
|- data_file.txt <br />
|- dev.env <br />
|- docker-compose.yaml <br />
|- Dockerfile <br />
|- Readme.md <br />
|- grafana-dashboard.yaml <br />
|- grafana-datasource.yaml <br />
|- Jenkinsfile <br />
|- Readme.md <br />

# Run Project local

In order of running project local it's necessary to have install [xk6](https://k6.io/docs/javascript-api/xk6-disruptor/get-started/installation/) with the following package
- dotenv

For additional packages installation please consult the [url](https://k6.io/docs/extensions/get-started/explore/) for the package list available.

For this, after install xk6, exectute the following command: <br />

```xk6 build --with github.com/szkiba/xk6-dotenv@latest``` 
<br />

After the build of k6 binary the run command shown in K6 scripts section can be executed.

# Running on docker
To simplify running tests locally advise to install docker, this will make not necessary to install all dependencies. After docker is installed, build the docker image from Dockerfile on the root of the project directory, then execute the command to run the image with a terminal
<br />

```docker run --rm -it --entrypoint "" IMAGEID_OR_TAG ./k6 run --config config.json --env ENV=ENVIROMENT_TO_RUN load_test_scripts/TEST_FILE_NAME.js```
<br />

Example on how to run a k6 script with our docker compose file
<br />
```docker-compose run k6 ./k6 run --config config.json --env ENV=ENVIROMENT_TO_RUN load_test_scripts/TEST_FILE_NAME.js```
<br />
NOTE: 
<br />
.env file must be created before any command execution
<br />
This command has the assumption that docker-compose is up and running (use "docker-compose up -d" command)
<br />
Also config.json must be set before running
<br />
As for the --env parameter it's only required when to run the script in PROD where we are using tracking numbers from a data file.

# K6 scripts
Inside the local terminal execute the follwoing command to run a test file
./k6 run --config ./config.json --env ENV=ENVIROMENT_TO_RUN load_test_scripts/TEST_FILE_NAME.js

NOTE:
<br />
.env file must be created before any command execution
<br />
config.json must be set before running
<br />
As for the --env parameter it's only required when to run the script in PROD where we are using tracking numbers from a data file.

If you want the test output on grafana you need to pass the following tag before the name the script file:
--out influxdb=INFLUX_URL_WITH_PORT

##Config file instructions
To execute the k6 scripts need to add the configs in the config.json as start an example is commited into this project, but for more information the k6 [documentation](https://k6.io/docs/using-k6/k6-options/)

# Running on GitHub Actions
In Order to run load scripts according to the test flow that we want to test go to Actions tab on Github project, select workflow to run and click Run workflow.
<br />
When this action is perfomed the following fields will need to be filled:
<br />
- "The environment to run within visible API": Allows to select the environment where the test will be run, by default sandsbox2 environment is selected.
<br />
- "Define type of execution": Here you can select two types of executions
<br />
    - iterations: This is when the X number of requests is defined to run in a Y timeframe window.
    <br />
        Required fields for this execution type:
        <br />
            - The number of requests (iterations) to be executed
        <br />
            - The duration of execution in seconds/minutes/hours (examples 1s/1m/1h)
    <br />
    - vus: Vus also known as threads this allow you to define X number of virtual users (vus) to execute the maximum amount of load that they can in Y timeframe window
    <br />
        Required fields for this execution type:
        <br />
            - The number of threads (VUS) to run with (concurrent executions) (required field for execution type vus)
        <br />
            - The duration of execution in seconds/minutes/hours (examples 1s/1m/1h)
    <br />
    NOTE: In case of required fields aren't fill according to execution type, the script will run with the default values already inserted. If those values are deleted and the fields are left empty will case an error and script won't execute
<br />
- "The number of requests (iterations) to be executed": If per example want o execute 100k requests this need to be put in extense on the field (100k -> 100000)
<br />
- "The duration of execution in seconds/minutes/hours (examples 1s/1m/1h)": This is where execution timeframe is defined, this field accepts time in the following formats seconds/minutes/hours (examples 1s/1m/1h)
<br />
- "The number of threads (VUS) to run with (concurrent executions) (required field for execution type vus)": The number of VUS inserted need to be in extense and not using decimal or other type of anotations
<br />
- "The ship date format: yyyy-MM-dd": In some load scripts we want to control the shipment date value, and needs to be inserted with the following format "yyyy-MM-dd", if no date inserted in this field the today date will be the value used in testing
<br />
- "The OCT-ECL Auth Key to use": Required Auth Key that need to match Client Key to perform the request to endpoint with success, this value is required for any execution
<br />
- "The OCT-ECL Client Key to use": Required Client Key that need to match Auth Key to perform the request to endpoint with success, this value is required for any execution

# Docker-Compose
After getting services on docker compose by running the command
docker-compose up -d

After starting docker-compose, grafana dashboard can be accessed by th following url http://localhost:3000


# Sensitive data
For sensitive data use the .env file, create an .env file using the dev.env file structure example. If new sensitive data is added should be created new variable in the .env file with the data in it and the new variable name added to the dev.env. The sensible data is stored in this github project in settings under Environments, each of it has the same variable names in order to match the values in the script


