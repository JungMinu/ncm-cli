'use strict'

const readline = require('readline')

const url = require('url')
const pDefer = require('p-defer')
const clientRequest = require('./client-request')
const { getTokens, api } = require('./config')
const logger = require('./logger')
const { GraphQLClient } = require('graphql-request')

module.exports = {
  formatAPIURL,
  graphql,
  handleError,
  queryReadline,
  refreshSession
}

function formatAPIURL (pathname, query) {
  return url.format({
    protocol: 'https',
    hostname: api,
    pathname,
    query
  })
}

function graphql (options, query, vars) {
  if (typeof options === 'string') {
    options = { options }
  }

  const client = new GraphQLClient(options.url, {
    headers: {
      Authorization: `Bearer ${options.token}`
    }
  })

  return client.request(query, vars)
}

function refreshSession () {
  let { refreshToken } = getTokens()

  clientRequest({
    method: 'GET',
    uri: formatAPIURL('/accounts/auth/refresh'),
    json: true,
    headers: {
      Authorization: `Bearer ${refreshToken}`
    }
  }).catch(handleError)
}

function queryReadline (query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  const deferred = pDefer()
  rl.question(query, answer => {
    deferred.resolve(answer)
    rl.close()
  })

  return deferred.promise
}

function handleError (err) {
  switch (err) {
    case 'Config::NoAction':
      logger([{ text: `Not a valid action.`, style: 'error' }])
      logger()
      break
    case 'Config::SetInvalidField':
      logger([{ text: `Could not set value.`, style: 'error' }])
      logger()
      break
    case 'Config::GetInvalidField':
      logger([{ text: `Could not get value.`, style: 'error' }])
      logger()
      break
    case 'Config::DelInvalidField':
      logger([{ text: `Could not delete value.`, style: 'error' }])
      logger()
      break
    case '':
      break
    default:
      logger([{ text: err, style: 'error' }])
      break
  }
}