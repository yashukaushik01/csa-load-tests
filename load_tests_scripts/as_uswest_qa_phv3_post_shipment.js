import { group, check } from "k6";
import http from "k6/http";
import { randomString } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";
import { Counter } from "k6/metrics";
import file from 'k6/x/file';

// Result Counters
const failed_data_file_path = 'failed_phv3_shipment_results.txt';
const successStatus200Counter = new Counter('success_Status_code_200');
const errorStatus400Counter = new Counter('errors_Status_code_400');
const errorStatus422Counter = new Counter('errors_Status_code_422');
const errorStatus500Counter = new Counter('errors_Status_code_500');

// Result File
const result_file_path = "../phv3_post_shipment_transactionId_result_file.txt";

// Get Config
const config = JSON.parse(open("../config.json")).phv3;

// Prepare request data 
const shipmentRequest = {
  toAddress: {
    name: "Mr. Forward",
    company: "Forward",
    street1: "186 CANNONGATE III RD",
    street2: "",
    city: "NASHUA",
    state: "NH",
    zip: "03063",
    country: "US",
    phone: "5708208072",
    email: "demo1-dev@maersk.com",
    verify: false,
  },
  fromAddress: {
    name: "Mr. NASHUA",
    company: "NASHUAUS",
    street1: "186 CANNONGATE III RD",
    street2: "",
    city: "NASHUA",
    state: "NH",
    zip: "03063",
    country: "US",
    phone: "5708208072",
    email: "demo1-dev@maersk.com",
    verify: false,
  },
  packages: [
    {
      packageType: "parcel",
      length: 2,
      width: 1,
      height: 1,
      weight: 7,
    },
  ],
  service: "PriorityMail",
  carrierAccountId: config.carrierAccountId,
  postageLabel: {
    labelFileType: "PDF",
    labelType: "URL",
  },
};

export default function postShipmentRequest() {
  file.clearFile(result_file_path);
  group('Post shipment request', () => {
    const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'sort'});
    let transactionId = `TranS_${date}_${randomString(29, 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;
    const url = `${config.baseURL}shipment`;
    console.log(transactionId);
    let post_shipment_request = http.post(
      url,
      JSON.stringify(shipmentRequest),
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          TransactionId: transactionId,
          "Authorization": `Bearer ${config.token}`,
        }
      }
    );

    check(post_shipment_request, {
      'is status 200': (response) => response.status === 200
    });
    
    // Write transactionId for get shipment & refund for succesfull request
    if (post_shipment_request.status == 200) {
      file.appendString(result_file_path, `${transactionId}`);
    }

    // Logs to help get information of failed requests on live executed load tests
    if (post_shipment_request.status != 200) {
      file.appendString(failed_data_file_path, `'${transactionId}','${post_shipment_request.status}','${post_shipment_request.body}'\n`);
      file.appendString(failed_data_file_path, `curl -X POST "${url}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${config.token}" -H "TransactionId: ${transactionId}" -d "${shipmentRequest}"\n`);

      // To console the response
      // console.log(post_shipment_request.status);
      // console.error(post_shipment_request.headers);
      // console.error(post_shipment_request.body);
    }
    switch (post_shipment_request.status) {
      case 0:
        errorStatusCounter.add(1);
        break;
      case 200:
        successStatus200Counter.add(1);
        break;
      case 400:
        errorStatus400Counter.add(1);
        break;
      case 422:
        errorStatus422Counter.add(1);
        break;
      case 500:
        errorStatus500Counter.add(1);
        break;
      default:
        break;
    }
  });
}
