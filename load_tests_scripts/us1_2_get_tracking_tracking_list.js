import { group, check } from "k6";
import http from "k6/http";
import dotenv from "k6/x/dotenv";
import file from 'k6/x/file';
import { scenario } from 'k6/execution';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const env = dotenv.parse(open("../.env"));

//Generates a list of tracking numbers that match the test dummy data in servers
const tracking_number_list = new SharedArray('tracking_number_list', () => {
    let tracking_number_list = [];

    tracking_number_list = open("../data_file.txt").split(/\n/);
    tracking_number_list.splice(-1);

    return tracking_number_list;
});

const failed_data_file_path = 'failed_data_results.txt';
const counterErrorStatus0 = new Counter('errors_timeout_error');
const counterErrorStatus400 = new Counter('errors_status_code_400');
const counterErrorStatus503 = new Counter('errors_Status_code_503');

export default function getTrackingRequest() {
    let iteration_index = scenario.iterationInTest >= tracking_number_list.length ? scenario.iterationInTest - tracking_number_list.length : scenario.iterationInTest;
    let tracking_number = tracking_number_list[iteration_index];

    group('Get Tracking request', () => {
        let get_tracking_request = http.get(
            `${env.ECL_OCT_API_BASE_URL}/TrackShipment/${tracking_number}`,
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "Authorization": `ApiKey ${env.ECL_OCT_API_AUTH_KEY}`,
                    "ClKey": `${env.ECL_OCT_CLIENT_KEY}`
                }
            }
        );

        check(get_tracking_request, {
            'is status 200': (response) => response.status === 200
        });

        // Logs into a file to help get information of failed requests on live executed load tests
        if (get_tracking_request.status != 200) {
            file.appendString(failed_data_file_path, `'${tracking_number}','${get_tracking_request.status}','${get_tracking_request.body}'\n`);
        }

        switch (get_tracking_request.status) {
            case 0:
                counterErrorStatus0.add(1);
                break;
            case 400:
                counterErrorStatus400.add(1);
                break;
            case 503:
                counterErrorStatus503.add(1);
                break;
            default:
                break;
        }
    });
}
