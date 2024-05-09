import { group, check } from "k6";
import http from "k6/http";
import file from 'k6/x/file';
import { Counter } from 'k6/metrics';
import { scenario } from 'k6/execution';
import { SharedArray } from 'k6/data';

// Result Counters
const failed_data_file_path = 'failed_phv3_get_shipment_results.txt';
const errorStatusCounter = new Counter('timeout_errors');
const successStatus200Counter = new Counter('success_Status_code_200');
const errorStatus400Counter = new Counter('errors_Status_code_400');
const errorStatus422Counter = new Counter('errors_Status_code_422');
const errorStatus500Counter = new Counter('errors_Status_code_500');

const transactionId_list = new SharedArray('transactionId_list', () => {
  let transactionId_list = [];

  transactionId_list = open("../phv3_post_shipment_transactionId_result_file.txt").split(/\n/);
  transactionId_list.splice(-1);

  if (transactionId_list.length <= 0) {
    transactionId_list = open("../phv3_transactionId_data_file.txt").split(/\n/);
    transactionId_list.splice(-1);
    console.log("Using the master list");
  }
  return transactionId_list;
});

export default function getShipmentRequest() {

  group('Get shipment request', () => {
    let iteration_index = scenario.iterationInTest >= transactionId_list.length ? scenario.iterationInTest - transactionId_list.length : scenario.iterationInTest;
    let transactionId = transactionId_list[iteration_index];
    const url = `${config.baseURL}shipment?Key=TransactionId&Value=${transactionId}`;
    
    let get_shipment_request = http.get(
      url,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          "Authorization": `Bearer ${config.token}`,
        }
      }
    );

    check(get_shipment_request, {
      'is status 200': (response) => response.status === 200
    });

    // Logs to help get information of failed requests on live executed load tests
    if (get_shipment_request.status != 200) {
      file.appendString(failed_data_file_path, `'${transactionId}','${get_shipment_request.status}','${get_shipment_request.body}'\n`);
      file.appendString(failed_data_file_path, `curl -X GET "${url}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${config.token}" -H "TransactionId: ${transactionId}"\n`);

      // To console the response
      console.log(url);
      console.log(get_shipment_request.status);
      console.error(get_shipment_request.body);
    }
    switch (get_shipment_request.status) {
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
