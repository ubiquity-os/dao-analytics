# DAO Analytics

> Later, when we onboard a couple of partners, we could iterate on that UI to deduce actionable steps for partners to increase their org performance.

The implementation is not decided and this was thrown together over a day or two possible implementations are:

- real-time dashboard (if built as a plugin)
- retroactive data fetching (if using the GitRoll approach)

## Description
I took inspiration from [GitRoll](https://gitroll.io/) with the intention of building an analytics tool for DAOs (GitHub Orgs). The tool will provide insights into the activity of contributors, issue/PR lifecycle, and other metrics that can help DAOs make data-driven decisions.

## Early Demo

I built the data fetching first as a plugin which would collect the data and update it in real-time as opposed to a retroactive fetch. Although it was easier to build the UI and such with a full data set but this would make a great plugin for a real-time dashboard.

<video src="https://github.com/user-attachments/assets/9ce6729c-5e12-4471-b14d-9e34e4bdd4cc" controls></video>