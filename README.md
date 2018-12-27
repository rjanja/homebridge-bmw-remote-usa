# homebridge-bmw-remote-usa
Control the locks on your BMW Connected vehicle (USA)

## Disclaimer

These API calls are designed to allow you to interact with your BMW vehicle. Use of these API calls is done entirely at your own risk. They are neither officially provided nor sanctioned.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

In order to authenticate against the API you will need to be registered on [BMW's Connected Drive service](https://connecteddrive.bmwusa.com/).

## Installation

1. Install homebridge using: `npm install -g homebridge`
2. Install this plugin using: `npm install -g homebridge-bmw-remote-usa`
3. Update your homebridge config file
4. Restart homebridge

# Configuration

## `config.json`

```json
{
    "accessory": "BMWRemoteUSA",
    "name": "My Car",
    "vin": "",
    "username": "",
    "password": "ABC123",
    "authBasic": "ABC123==",
    "securityQuestionSecret": ""
}
```

## Parameters

|             Parameter            |                       Description                       | Required |
| -------------------------------- | ------------------------------------------------------- |:--------:|
| `name`                           | Name of the accessory e.g. Grandma's BMW                                  |     ✓    |
| `vin`                            | VIN number of the car                                   |     ✓    |
| `username`                       | Username for BMW's Connected Drive service              |     ✓    |
| `password`                       | Password for BMW's Connected Drive service              |     ✓    |
| `authBasic`                      | Basic Auth for BMW's oAuth2 servers                     |     ✓    |
| `securityQuestionSecret`         | Answer to the account security question                 |         |

## Basic Auth

The API key and API secret (not available here) are Base64 encoded and become the parameter needed as `authBasic`. These strings are available elsewhere as they're built into every official BMW ConnectedDrive app and have been reverse engineered.

See also (https://github.com/edent/BMW-i-Remote#authorisation)[BMW-i-Remote's Authorisation page].

