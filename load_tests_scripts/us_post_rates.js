import { group, check } from "k6";
import http from "k6/http";
import dotenv from "k6/x/dotenv";
import file from 'k6/x/file';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { Counter } from 'k6/metrics';

const env = dotenv.parse(open("../.env"));
const failed_data_file_path = 'failed_data_results.txt';
const counterErrorStatus0 = new Counter('errors_timeout_error');
const counterErrorStatus400 = new Counter('errors_Status_code_400');
const counterErrorStatus500 = new Counter('errors_Status_code_500');

export default function postShippingLabelRequest() {

    function getRandomFloatBetweenOneAndXTruncated(X) {
        const randomFloat = Math.random() * (X - 1) + 1;
        return Number(randomFloat.toFixed(2));
    }

    group('Post Shipping Label request', () => {
        let unique_zone = `${randomString(1, '12345678')}`;
        const randomHeight = getRandomFloatBetweenOneAndXTruncated(10)
        const randomLenght = getRandomFloatBetweenOneAndXTruncated(10)
        const randomWidth = getRandomFloatBetweenOneAndXTruncated(10)
        const randomWeight = getRandomFloatBetweenOneAndXTruncated(10)

        let today = env.SHIPDATE !== undefined && env.SHIPDATE !== null
        ? env.SHIPDATE
        : new Date().toISOString().slice(0, 10);

        let body = `{
            "carrier": "BetterTrucks",
            "serviceType": "BetterTrucksNextDay",
            "zone": "${unique_zone}",
            "parcel": {
                "packageType": "parcel",
                "height": 10,
                "length": 10,
                "width": 10,
                "unitOfMeasure": "In",
                "weight": {
                    "value": ${randomWeight},
                    "unitOfMeasure": "Lbs"
                }
            }
        }`;
        let post_rates_request = http.post(
            `${env.ECL_OCT_API_BASE_URL}`,
            body,
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "ApiKey": `${env.OCT_RATES_API_KEY}`
                },
                tags: {
                    name: "Oct-Rates-Api"
                }
            }
        );

        check(post_rates_request, {
            'is status 200': (response) => response.status === 200,
            'is status 404': (response) => response.status === 404

        });

        // Logs to help get information of failed requests on live executed load tests
        if (post_rates_request.status != 200 || post_rates_request.status != 404) {
            file.appendString(failed_data_file_path, `'${unique_zone}','${post_rates_request.status}','${post_rates_request.body}'\n`);
            file.appendString(failed_data_file_path, `curl -X POST "${env.ECL_OCT_API_BASE_URL}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${env.ECL_OCT_API_AUTH_KEY}" -H "ClKey: ${env.ECL_OCT_CLIENT_KEY}" -d "${body}"\n`);
        }
        switch (post_rates_request.status) {
            case 0:
                counterErrorStatus0.add(1);
                break;
            case 400:
                counterErrorStatus400.add(1);
                break;
            case 500:
                counterErrorStatus500.add(1);
                break;
            default:
                break;
        }
    });
}
