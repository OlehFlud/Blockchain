<template>
  <div>
    <md-table v-model="domains" :table-header-color="tableHeaderColor" >
      <md-table-row slot="md-table-row" slot-scope="{ item }">
        <md-table-cell md-label="Name">{{ item.name }}</md-table-cell>
        <md-table-cell md-label="Date">{{ item.date }}</md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script>
import { metrics } from "../../tokenContract";
export default {
  name: "simple-table",
  props: {
    tableHeaderColor: {
      type: String,
      default: "",
    },
  },
  data() {
    return {
      metrics,
      selected: [],
      domains: [],
    };
  },
  watch: {
    '$route.params': function(search) {
      console.log('search',search)
    },
    deep: true,
    immediate: true,
  },
  async created() {
    await this.$nextTick()
    const resp = await this.metrics();
    console.log('respw',resp);
    this.domains = resp.map((log)=> {
      return {
        name: log.args[0],
        date: log.args[2]
      }
    });
  },
  async mounted() {
    await this.$nextTick()
    const resp = await this.metrics();
    console.log('respw',resp);
    this.domains = resp.map((log)=> {
      return {
        name: log.args[0],
        date: new Date(log.args[2] * 1000),
      }
    });
  }
};
</script>
