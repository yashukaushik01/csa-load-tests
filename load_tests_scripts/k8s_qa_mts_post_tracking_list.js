import { group, check } from "k6";
import http from "k6/http";
import file from 'k6/x/file';
import { scenario } from 'k6/execution';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

//Generates a list of tracking numbers that match the test dummy data in servers
const tracking_number_list = new SharedArray('tracking_number_list', () => {
    let tracking_number_list = [];

    tracking_number_list = open("../data_file.txt").split(/\n/);
    tracking_number_list.splice(-1);

    return tracking_number_list;
});

const counterErrorStatus0 = new Counter('errors_timeout_error');
const counterErrorStatus400 = new Counter('errors_status_code_400');
const counterErrorStatus503 = new Counter('errors_Status_code_503');

export default function postTrackingRequest() {
  let iteration_index =
    scenario.iterationInTest >= tracking_number_list.length
      ? scenario.iterationInTest - tracking_number_list.length
      : scenario.iterationInTest;
  let tracking_number = tracking_number_list[iteration_index];

  group("Post Tracking request", () => {
    let data = {
      trackings: [
        {
          carrierCode: "USPS",
          trackingNumbers: [tracking_number],
        },
      ],
    };


    let get_tracking_request = http.post(
      `https://mts-api-dev.maersk-digital.dev/api/v4/Tracking?action=AddToQueue`,
      JSON.stringify(data),
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "content-type": "application/json",
          APIKey: `CC80EA2F-C94A-4D89-9E76-F6E031E1632D`,
        },
      }
    );

    check(get_tracking_request, {
      "is status 200": (response) => response.status === 200,
    });

    // Logs to help get information of failed requests on live executed load tests
    if (get_tracking_request.status != 200) {
      console.log(tracking_number);
      console.log(get_tracking_request.headers);
      console.log(get_tracking_request.status);
      console.log(get_tracking_request.body);
    }
  });
}

