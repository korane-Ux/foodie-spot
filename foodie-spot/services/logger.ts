import { logger, consoleTransport } from 'react-native-logs';
import config from '../constants/config';


const defaultConfig = {
    levels : {
        debug : 0,
        info : 1,
        warn : 2,
        error : 3,
    },
    severity: config.apiUrl.includes('localhost') ? 'debug' : 'info',
    transport: consoleTransport,
    // transportOptions: {
    //     colors: {
    //         info: 'blueBright',
    //         warn: 'yellowBright',
    //         error: 'redBright',
    //     },
    // },
    async: true,
    dateFormat: 'time',
    printLevel: true,
    printDate: true,
    enabled: true,
};

const log = logger.createLogger(defaultConfig);

export default log;