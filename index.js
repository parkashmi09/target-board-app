/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

// Initialize i18n early
import './src/i18n';

import App from './App';

AppRegistry.registerComponent(appName, () => App);
