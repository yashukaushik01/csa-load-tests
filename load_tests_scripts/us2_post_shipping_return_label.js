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


    group('Post Shipping Label request', () => {
        let unique_request_id_return_label = `lturirl${randomString(29, 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;
        let today = env.SHIPDATE !== undefined && env.SHIPDATE !== null
        ? env.SHIPDATE
        : new Date().toISOString().slice(0, 10);
        let body = `{
          "carrier": "USPS",
          "serviceType": "PriorityMail",
          "UniqueRequestId": "${unique_request_id_return_label}",
          "IntegratorClientID": null,
          "CustomText1": "T-12123123123123",
          "CustomText2": null,
          "shipDate": "${today}",
          "PreferredFormat": "PDF",
          "PreferredSize": "0",
          "PreferredDPI": "DPI203",
          "toAddress": {
            "name": "TEMU RETURNS",
            "company": "",
            "phone": "4444444444",
            "address1": "304 Hudson Street",
            "address2": "Suite 111",
            "address3": "",
            "city": "New York",
            "stateProvince": "NY",
            "postalCode": "10012",
            "country": "US",
            "isResidential": false,
            "description": "",
            "email": "info@sample.com"
          },
          "fromAddress": {
            "name": "TEMU CUSTOMER",
            "company": "",
            "phone": "",
            "address1": "7101 NW 32nd Avenue",
            "address2": "",
            "city": "Miami",
            "stateProvince": "FL",
            "postalCode": "33147",
            "country": "US",
            "isResidential": false,
            "description": null,
            "email": "info@sample.com"
          },
          "packages": [
            {
              "PackageNumber": "1",
              "PackageIdentifier": "",
              "length": 6,
              "width": 6,
              "height": 10,
              "dimensionUnit": "IN",
              "weight": 0.2,
              "weightUnit": "lb",
              "packageType": "Package",
              "value": 500,
              "currencyCode": "usd"
            }
          ],
          "Options": {
            "RETURN LABEL": "TRUE"
          }
        }`;
        let post_shipping_label_request = http.post(
            `${env.ECL_OCT_API_BASE_URL}/ShippingLabel`,
            body,
            {
                headers: {
                    accept: "application/json, text/plain, */*",
                    "content-type": "application/json",
                    "Authorization": `ApiKey ${env.ECL_OCT_API_AUTH_KEY}`,
                    "ClKey": `${env.ECL_OCT_CLIENT_KEY}`
                }
            }
        );

        check(post_shipping_label_request, {
            'is status 200': (response) => response.status === 200
        });

        // Logs to help get information of failed requests on live executed load tests
        if (post_shipping_label_request.status != 200) {
            file.appendString(failed_data_file_path, `'${unique_request_id_return_label}','${post_shipping_label_request.status}','${post_shipping_label_request.body}'\n`);
            file.appendString(failed_data_file_path, `curl -X POST "${env.ECL_OCT_API_BASE_URL}/ShippingLabel" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${env.ECL_OCT_API_AUTH_KEY}" -H "ClKey: ${env.ECL_OCT_CLIENT_KEY}" -d "${body}"\n`);
        }
        switch (post_shipping_label_request.status) {
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
