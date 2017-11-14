import api from './../api';
import repos from './../repos';

export default async function(eachCallback) {
  for (let i = 0; i < repos.length; i++) {
    await eachCallback(api, repos[i]);
  }
}
