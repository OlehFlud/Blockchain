<template>
  <div class="content">
    <div>
      <md-card-header
        data-background-color="green"
        style="display: flex; flex-direction: column"
      >
        <md-button
          :class="currentAddress != 'undefined' ? 'md-success' : ''"
          style="width: 885px"
          v-on:click="onClickConnect()"
          >{{
            currentAddress !== "undefined" ? "Connected" : "Connect"
          }}</md-button
        >
        <h4 style="margin-top: 2%">Current address: {{ currentAddress }}</h4>
      </md-card-header>
    </div>

    <div style="display: flex; grid-template-columns: 1fr">
      <div style="width: 1100px">
        <md-card-header style="display: flex; margin-top: 5%">
          <h4 class="title" style="width: 200px">Choose payment method</h4>
          <label for="paymentMethod">{{ paymentMethod }}</label>
          <md-select v-model="paymentMethod" name="paymentMethod" id="paymentMethod" style="width: 20% !important; font-size: 20px; margin-left: 20px;">
            <md-option value="ETH">ETH</md-option>
            <md-option value="USDC">USDC</md-option>
          </md-select>
        </md-card-header>

        <md-card-header style="display: flex; margin-top: 5%">
          <h4 class="title" style="width: 200px">Register domain</h4>
          <md-input
            style="width: 50%; font-size: 20px; margin-left: 20px"
            v-model="domain"
          ></md-input>
          <md-button
            style="margin-left: 20px"
            v-on:click="createDomain(domain, paymentMethod)"
            >Register</md-button
          >
        </md-card-header>

        <md-card-header style="display: flex; margin-top: 5%">
          <h4 class="title" style="width: 200px">Get address by name</h4>
          <md-input
            style="width: 50%; font-size: 20px; margin-left: 20px"
            v-model="nameToSearch"
          ></md-input>
          <md-button
            style="margin-left: 20px"
            v-on:click="getDomainController(nameToSearch)"
            >Submit</md-button
          >
        </md-card-header>

        <md-card-header style="display: flex; margin-top: 5%" v-if="controller">
          <h4 style="margin-top: 2%">
            Address of controller: {{ controller }}
          </h4>
        </md-card-header>
      </div>

      <md-card-header
        style="
          width: 200px;
          margin-top: 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
        "
      >
        <md-button v-on:click="getBalance()">Get Balance</md-button>
        <p class="category" style="margin-top: 10px">Balance</p>
        <h3 class="title" style="margin-top: 2px">{{ balance }}</h3>
      </md-card-header>
    </div>
    <md-button
      style="margin-left: 42%; margin-top: 10%; width: 250px; height: 50px"
      >Withdrawal</md-button
    >
  </div>
</template>

<script>
import { onClickConnect } from "../api";
import {
  createDomain,
  createSubdomain,
  getDomainController,
  getBalance,
} from "../tokenContract";
export default {
  data() {
    return {
      dailySalesChart: {
        data: {
          labels: ["M", "T", "W", "T", "F", "S", "S"],
          series: [[12, 17, 7, 17, 23, 18, 38]],
        },
        options: {
          lineSmooth: this.$Chartist.Interpolation.cardinal({
            tension: 0,
          }),
          low: 0,
          high: 50, // creative tim: we recommend you to set the high sa the biggest value + something for a better look
          chartPadding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
      },
      dataCompletedTasksChart: {
        data: {
          labels: ["12am", "3pm", "6pm", "9pm", "12pm", "3am", "6am", "9am"],
          series: [[230, 750, 450, 300, 280, 240, 200, 190]],
        },

        options: {
          lineSmooth: this.$Chartist.Interpolation.cardinal({
            tension: 0,
          }),
          low: 0,
          high: 1000, // creative tim: we recommend you to set the high sa the biggest value + something for a better look
          chartPadding: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
      },
      emailsSubscriptionChart: {
        data: {
          labels: [
            "Ja",
            "Fe",
            "Ma",
            "Ap",
            "Mai",
            "Ju",
            "Jul",
            "Au",
            "Se",
            "Oc",
            "No",
            "De",
          ],
          series: [
            [542, 443, 320, 780, 553, 453, 326, 434, 568, 610, 756, 895],
          ],
        },
        options: {
          axisX: {
            showGrid: false,
          },
          low: 0,
          high: 1000,
          chartPadding: {
            top: 0,
            right: 5,
            bottom: 0,
            left: 0,
          },
        },
        responsiveOptions: [
          [
            "screen and (max-width: 640px)",
            {
              seriesBarDistance: 5,
              axisX: {
                labelInterpolationFnc: function (value) {
                  return value[0];
                },
              },
            },
          ],
        ],
      },
      currentAddress: "undefined",
      nameOfController: "undefined",
      domain: null,
      subdomain: null,
      controller: null,
      paymentMethod: 'ETH',
      balance: 0,
      onClickConnect,
      createDomain,
      createSubdomain,
      getDomainController,
      getBalance,
    };
  },
};
</script>
