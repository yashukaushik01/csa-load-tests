import { group, check } from "k6";
import http from "k6/http";
import dotenv from "k6/x/dotenv";
import file from 'k6/x/file';

const env = dotenv.parse(open("../.env"));
const failed_data_file_path = 'failed_data_results.txt';

export default function getTrackingRequest() {

    group('Get Tracking request', () => {
        let get_tracking_request = http.get(
            `${env.ECL_OCT_API_BASE_URL}/TrackShipment/9205590242326334603721`,
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

        // Logs to help get information of failed requests on live executed load tests
        if (get_tracking_request.status != 200) {
            file.appendString(failed_data_file_path, `'${tracking_number}','${get_tracking_request.status}','${get_tracking_request.body}'\n`);
        }
    });
}
