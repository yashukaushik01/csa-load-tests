import { group, check } from "k6";
import http from "k6/http";
import file from 'k6/x/file';
import { Counter } from 'k6/metrics';
import { scenario } from 'k6/execution';
import { SharedArray } from 'k6/data';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const failed_data_file_path = 'failed_phv3_post_shipment_refund_results.txt';
const errorStatusCounter = new Counter('timeout_errors');
const successStatus200Counter = new Counter('success_Status_code_200');
const errorStatus400Counter = new Counter('errors_Status_code_400');
const errorStatus422Counter = new Counter('errors_Status_code_422');
const errorStatus500Counter = new Counter('errors_Status_code_500');

const transactionId_list = new SharedArray('transactionId_list', () => {
  let transactionId_list = [];

  transactionId_list = open("../phv3_post_shipment_transactionId_result_file.txt").split(/\n/);
  transactionId_list.splice(-1);

  return transactionId_list;
});

export default function postShipmentRefundRequest() {

  group('Post shipment refund request', () => {
    let iteration_index = scenario.iterationInTest >= transactionId_list.length ? scenario.iterationInTest - transactionId_list.length : scenario.iterationInTest;
    let transactionId = transactionId_list[iteration_index];
    const date = new Date().toLocaleDateString('en-CA', { dateStyle: 'sort'});
    let newTransactionId = `TranR_${date}_${randomString(29, 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')}`;
    let refundRequest = {
      "key": "TransactionId",
      "value": transactionId,
    };
    
    console.log(`Env: ${env.PHv3_API_AUTH_KEY}`)
    const url = `${config.baseURL}shipment/refund`;

    let post_shipment_refund_request = http.post(
      url,
      refundRequest,
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          "TransactionId": newTransactionId,
          "Authorization": `Bearer ${config.token}`,
        }
      }
    );

    check(post_shipment_refund_request, {
      'is status 200': (response) => response.status === 200
    });

    console.log(`Refund url: ${url}`);
    console.log(`Refund Transaction Id: ${newTransactionId} and refunded shipment Transaction Id: ${transactionId} `);

    // Logs to help get information of failed requests on live executed load tests
    if (post_shipment_refund_request.status != 200) {
      file.appendString(failed_data_file_path, `'${transactionId}','${post_shipment_refund_request.status}','${post_shipment_refund_request.body}'\n`);
      file.appendString(failed_data_file_path, `curl -X POST "${url}" -H "accept: application/json, text/plain, */*" -H "content-type: application/json" -H "Authorization: ApiKey ${config.token}" -H "TransactionId: ${transactionId}" -d "${refundRequest}"\n`);

      // To console the response
      // console.log(post_shipment_refund_request.status);
      // console.error(post_shipment_refund_request.body);
    }
    switch (post_shipment_refund_request.status) {
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
