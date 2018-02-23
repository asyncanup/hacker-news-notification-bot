#!/usr/bin/env node
const fetch = require('node-fetch')
const { promisify } = require('util')
const { difference } = require('underscore')

const fs = require('fs')
const childProcess = require('child_process')

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const exec = promisify(childProcess.exec)

const timeout = ms => new Promise(res => setTimeout(res, ms))

async function notifyLatest() {
  const latestStoriesResponse = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
  const allLatestStories = (await latestStoriesResponse.json())
  const latestStories = allLatestStories.slice(0, 10)
  // console.log('new stories', latestStories)
  const oldStoriesText = await readFile(__dirname + '/stories.db')
  // console.log('old stories text', oldStoriesText)
  const oldStories = JSON.parse(oldStoriesText.toString()).slice(0, 10)
  // console.log('old stories', oldStories)
  const newStoryIds = difference(latestStories, oldStories)
  // console.log(newStoryIds.length + " new stories!")
  await writeFile(__dirname + '/stories.db', JSON.stringify(allLatestStories.slice(0, 20)))
  for (let itemId of newStoryIds.slice(0, 10)) {
    const itemResponse = await fetch('https://hacker-news.firebaseio.com/v0/item/' + itemId + '.json')
    const item = await itemResponse.json()
    const title = item.title.replace(/'/g, ",").replace(/"/g, "-")
    await exec(`osascript -e 'display notification "Hacker News: ${ title }" with title "${ title }" subtitle "${ item.descendants } comments" sound name "default"'`)
    await timeout(2000)
  }
  // console.log('done')
}

notifyLatest()

