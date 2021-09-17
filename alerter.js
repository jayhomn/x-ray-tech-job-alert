// RFT and RPT
const puppeteer = require("puppeteer");
const { Client, Intents, MessageEmbed } = require("discord.js");
require("dotenv").config();

const bot = new Client({
  intents: [Intents.FLAGS.GUILDS],
});
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// When the client is ready, run this code (only once)

bot.once("ready", () => {
  (async () => {
    const browser = await puppeteer.launch({
      headless: true,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(0);
    await page.goto(
      "https://internal-vch.icims.com/jobs/search?ss=1&searchKeyword=Technologist&searchRelation=keyword_all&searchCategory=91826&mobile=false&width=1240&height=3943&bga=true&needsRedirect=false&jan1offset=-480&jun1offset=-420&in_frame=1/"
    );

    await page.waitForSelector("iframe", {
      timeout: 0,
    });
    const elementHandle = await page.$("iframe");
    const frame = await elementHandle.contentFrame();
    const resultsSelector = "div.container-fluid.iCIMS_JobsTable > div.row";

    await frame.waitForSelector(resultsSelector, {
      timeout: 0,
    });

    const postings = await frame.$$(resultsSelector);

    for (const post of postings) {
      const jobLink = await post.$eval("a", (node) => {
        return node.getAttribute("href");
      });
      const location = await post.$(".description");
      const locationText = await location.evaluate((node) => {
        return node.innerText;
      });
      const name = await post.$eval("h2", (node) => {
        return node.innerText;
      });
      const additionalFields = await post.$(".additionalFields");
      const fields = await additionalFields.$$("dl");
      const jobType = await fields[0].$eval("span", (attr) => {
        return attr.innerText;
      });
      const datePosted = await fields[2].$eval("span", (attr) => {
        return attr.getAttribute("title");
      });
      const datePostedDate = new Date(datePosted);
      const dateNow = new Date();

      if (
        (name === "Radiological Technologist 1, General Procedures (RFT)" ||
          name === "Radiological Technologist 1, General Procedures (RPT)") &&
        (jobType.replace(/\s+/g, "") === "FullTime" ||
          jobType.replace(/\s+/g, "") == "PartTime") &&
        datePostedDate.getDate() === dateNow.getDate() - 1
      ) {
        bot.channels.cache
          .get(CHANNEL_ID)
          .send(
            `${jobLink}\n**Job Title:** ${name}\n**Type:** ${jobType}\n**Location:** ${locationText}\n**Date Posted:** ${datePosted}`
          );
      }
    }

    browser.close();
  })();
});

bot.login(TOKEN);
