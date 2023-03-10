import axios from 'axios';
import jwt from 'jsonwebtoken';
import HttpsProxyAgent from 'https-proxy-agent'


const config = {
  key: process.env.SALESFORCE_KEY,
  clientId: process.env.SALESFORCE_CLIENT_ID,
  userName: process.env.SALESFORCE_USERNAME,
  authUrl:
    process.env.SALESFORCE_AUTH_URL || 'https://login.salesforce.com',
  audience: process.env.SALESFORCE_AUDIENCE || 'https://login.salesforce.com',
  apiVersion: process.env.SALESFORCE_API_VERSION || 'v54.0',
  jwtGrantType: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
  accessTokenUrlFragment: '/services/oauth2/token',
  proxyUrl: process.env.PROXY_URL
}

const accessTokenUrl = `${config.authUrl}${config.accessTokenUrlFragment}`
const decodedKey = config.key && Buffer.from(config.key, 'base64').toString('utf-8')

const getAxiosClient = () => {
  const { proxyUrl } = config

  const instance = axios.create({
    timeout: 10000,
    proxy: false,
    httpsAgent: proxyUrl ? new HttpsProxyAgent.HttpsProxyAgent(proxyUrl) : undefined
  })
  return instance
}

export default async () => {
  const signedJwt = createSignedJwt();

  const axiosClient = getAxiosClient()

  //get access token
  const params = new URLSearchParams();
  params.set('grant_type', config.jwtGrantType);
  params.set('assertion', signedJwt);

  const accessTokenResponse = await axiosClient.post(accessTokenUrl, {}, { params })
  const accessToken = accessTokenResponse.data.access_token;
  const apiBaseUrl = accessTokenResponse.data.instance_url;

  const articleQuery = encodeURIComponent('FIND {article} IN ALL FIELDS RETURNING Knowledge__kav(Id, Title, Summary,SelfServiceResponse__c)')
  const salesforceApiUrl = `${apiBaseUrl}/services/data/${config.apiVersion}/search/?q=${articleQuery}`;
  const apiConfig = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }

  const apiResponse = await axiosClient.get(salesforceApiUrl, apiConfig)
  console.log(apiResponse.data.searchRecords)
}

//create a signed jwt token with an empty payload
export const createSignedJwt = () =>
  jwt.sign({}, decodedKey, {
    algorithm: 'RS256',
    issuer: config.clientId,
    audience: config.audience,
    subject: config.userName,
    expiresIn: '1h'
  });