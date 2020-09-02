const express = require("express");
var { graphqlHTTP } = require("express-graphql");
var { buildSchema } = require("graphql");
const axios = require("axios").default;

const app = express();

require("dotenv").config();

var schema = buildSchema(`
type Query {
    team(number: Int!): Team
}
type Team {
    team_number: Int!
    nickname: String!
    website: String
    events(year: Int): [Event]!
    years_participated: [Int]
    robots: [Robot]
}
type Event {
    event_code: String!
    key: String!
    name: String
    teams: [Team]!
}
type Robot {
  year: Int!
  robot_name: String!
  team_key: String!
  key: String!
}
`);

class Event {
  constructor(event) {
    Object.assign(this, event);
  }

  async teams() {
    let resp = await axios(
      `https://www.thebluealliance.com/api/v3/event/${this.key}/teams`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_AUTH_KEY,
        },
      }
    );

    return resp.data.map((i) => new Team(i));
  }
}

class Team {
  constructor(team) {
    Object.assign(this, team);
  }

  async events({ year }) {
    const url = year
      ? `https://www.thebluealliance.com/api/v3/team/frc${this.team_number}/events/${year}`
      : `https://www.thebluealliance.com/api/v3/team/frc${this.team_number}/events`;
    let resp = await axios(url, {
      headers: {
        "X-TBA-Auth-Key": process.env.TBA_AUTH_KEY,
      },
    });
    return resp.data.map((i) => new Event(i));
  }

  async years_participated() {
    let resp = await axios(
      `https://www.thebluealliance.com/api/v3/team/${this.key}/years_participated`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_AUTH_KEY,
        },
      }
    );

    return resp.data;
  }

  async robots() {
    let resp = await axios(
      `https://www.thebluealliance.com/api/v3/team/${this.key}/robots`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_AUTH_KEY,
        },
      }
    );

    return resp.data;
  }
}

var root = {
  team: async ({ number }) => {
    let resp = await axios(
      `https://www.thebluealliance.com/api/v3/team/frc${number}`,
      {
        headers: {
          "X-TBA-Auth-Key": process.env.TBA_AUTH_KEY,
        },
      }
    );

    return new Team(resp.data);
  },
};

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true,
  })
);

app.listen(3000, () => {
  console.log("woo-hoo!");
});
