import { type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, type Firestore, Timestamp } from 'firebase/firestore';

import type { CourseReview } from '@/types/review';
import type { UserProfile, UserProfileUpdate, ProfileCompletionData } from '@/types/user';

import { getDocuments, updateDocument } from './firebaseUtils';
import { getFirestoreDB } from './firebaseUtils';
import { uploadImage, deleteImage } from './storageUtils';

// Import Admin Firestore for server-side utility
import { getAdminFirestore } from '@/lib/firebase/firebaseAdmin';

// Imports for client-side Firestore operations
import { Timestamp as ClientTimestamp } from 'firebase/firestore';

// Imports for Admin Firestore operations
import { Timestamp as AdminTimestamp, FieldValue as AdminFieldValue, getFirestore as getAdminFirestoreInternal, DocumentData, Firestore as AdminFirestore } from 'firebase-admin/firestore';
// We need to be careful not to cause a circular dependency if firebaseAdmin also imports from userUtils indirectly.
// Assuming getAdminFirestore from firebaseAdmin.ts is the primary way to get admin db.

// Define a type for the necessary user data for profile creation
export interface CreateUserProfileInput {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

// ZIP code to state mapping for common ZIP ranges (US only)
const ZIP_TO_STATE_MAP: Record<string, string> = {
  // Alabama: 35000-36999
  '35': 'AL', '36': 'AL',
  // Alaska: 99500-99999
  '995': 'AK', '996': 'AK', '997': 'AK', '998': 'AK', '999': 'AK',
  // Arizona: 85000-86599
  '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '854': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '858': 'AZ', '859': 'AZ', '860': 'AZ', '861': 'AZ', '862': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ',
  // Arkansas: 71600-72999, 75502-75505
  '716': 'AR', '717': 'AR', '718': 'AR', '719': 'AR', '720': 'AR', '721': 'AR', '722': 'AR', '723': 'AR', '724': 'AR', '725': 'AR', '726': 'AR', '727': 'AR', '728': 'AR', '729': 'AR',
  // California: 90000-96699
  '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA', '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '910': 'CA', '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA', '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA', '920': 'CA', '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA', '926': 'CA', '927': 'CA', '928': 'CA', '930': 'CA', '931': 'CA', '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA', '937': 'CA', '938': 'CA', '939': 'CA', '940': 'CA', '941': 'CA', '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA', '947': 'CA', '948': 'CA', '949': 'CA', '950': 'CA', '951': 'CA', '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA', '957': 'CA', '958': 'CA', '959': 'CA', '960': 'CA', '961': 'CA', '962': 'CA', '963': 'CA', '964': 'CA', '965': 'CA', '966': 'CA',
  // Colorado: 80000-81699
  '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO', '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
  // Connecticut: 06000-06999
  '060': 'CT', '061': 'CT', '062': 'CT', '063': 'CT', '064': 'CT', '065': 'CT', '066': 'CT', '067': 'CT', '068': 'CT', '069': 'CT',
  // Delaware: 19700-19999
  '197': 'DE', '198': 'DE', '199': 'DE',
  // Florida: 32000-34999
  '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL', '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL', '340': 'FL', '341': 'FL', '342': 'FL', '343': 'FL', '344': 'FL', '345': 'FL', '346': 'FL', '347': 'FL', '348': 'FL', '349': 'FL',
  // Georgia: 30000-31999
  '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA', '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
  // Hawaii: 96700-96999
  '967': 'HI', '968': 'HI',
  // Idaho: 83200-83999
  '832': 'ID', '833': 'ID', '834': 'ID', '835': 'ID', '836': 'ID', '837': 'ID', '838': 'ID', '839': 'ID',
  // Illinois: 60000-62999
  '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL', '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL', '620': 'IL', '621': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  // Indiana: 46000-47999
  '460': 'IN', '461': 'IN', '462': 'IN', '463': 'IN', '464': 'IN', '465': 'IN', '466': 'IN', '467': 'IN', '468': 'IN', '469': 'IN', '470': 'IN', '471': 'IN', '472': 'IN', '473': 'IN', '474': 'IN', '475': 'IN', '476': 'IN', '477': 'IN', '478': 'IN', '479': 'IN',
  // Iowa: 50000-52999
  '500': 'IA', '501': 'IA', '502': 'IA', '503': 'IA', '504': 'IA', '505': 'IA', '506': 'IA', '507': 'IA', '508': 'IA', '509': 'IA', '510': 'IA', '511': 'IA', '512': 'IA', '513': 'IA', '514': 'IA', '515': 'IA', '516': 'IA', '517': 'IA', '518': 'IA', '519': 'IA', '520': 'IA', '521': 'IA', '522': 'IA', '523': 'IA', '524': 'IA', '525': 'IA', '526': 'IA', '527': 'IA', '528': 'IA', '529': 'IA',
  // Kansas: 66000-67999
  '660': 'KS', '661': 'KS', '662': 'KS', '663': 'KS', '664': 'KS', '665': 'KS', '666': 'KS', '667': 'KS', '668': 'KS', '669': 'KS', '670': 'KS', '671': 'KS', '672': 'KS', '673': 'KS', '674': 'KS', '675': 'KS', '676': 'KS', '677': 'KS', '678': 'KS', '679': 'KS',
  // Kentucky: 40000-42799
  '400': 'KY', '401': 'KY', '402': 'KY', '403': 'KY', '404': 'KY', '405': 'KY', '406': 'KY', '407': 'KY', '408': 'KY', '409': 'KY', '410': 'KY', '411': 'KY', '412': 'KY', '413': 'KY', '414': 'KY', '415': 'KY', '416': 'KY', '417': 'KY', '418': 'KY', '419': 'KY', '420': 'KY', '421': 'KY', '422': 'KY', '423': 'KY', '424': 'KY', '425': 'KY', '426': 'KY', '427': 'KY',
  // Louisiana: 70000-71599
  '700': 'LA', '701': 'LA', '702': 'LA', '703': 'LA', '704': 'LA', '705': 'LA', '706': 'LA', '707': 'LA', '708': 'LA', '709': 'LA', '710': 'LA', '711': 'LA', '712': 'LA', '713': 'LA', '714': 'LA', '715': 'LA',
  // Maine: 03900-04999
  '039': 'ME', '040': 'ME', '041': 'ME', '042': 'ME', '043': 'ME', '044': 'ME', '045': 'ME', '046': 'ME', '047': 'ME', '048': 'ME', '049': 'ME',
  // Maryland: 20600-21999
  '206': 'MD', '207': 'MD', '208': 'MD', '209': 'MD', '210': 'MD', '211': 'MD', '212': 'MD', '213': 'MD', '214': 'MD', '215': 'MD', '216': 'MD', '217': 'MD', '218': 'MD', '219': 'MD',
  // Massachusetts: 01000-02799
  '010': 'MA', '011': 'MA', '012': 'MA', '013': 'MA', '014': 'MA', '015': 'MA', '016': 'MA', '017': 'MA', '018': 'MA', '019': 'MA', '020': 'MA', '021': 'MA', '022': 'MA', '023': 'MA', '024': 'MA', '025': 'MA', '026': 'MA', '027': 'MA',
  // Michigan: 48000-49999
  '480': 'MI', '481': 'MI', '482': 'MI', '483': 'MI', '484': 'MI', '485': 'MI', '486': 'MI', '487': 'MI', '488': 'MI', '489': 'MI', '490': 'MI', '491': 'MI', '492': 'MI', '493': 'MI', '494': 'MI', '495': 'MI', '496': 'MI', '497': 'MI', '498': 'MI', '499': 'MI',
  // Minnesota: 55000-56799
  '550': 'MN', '551': 'MN', '552': 'MN', '553': 'MN', '554': 'MN', '555': 'MN', '556': 'MN', '557': 'MN', '558': 'MN', '559': 'MN', '560': 'MN', '561': 'MN', '562': 'MN', '563': 'MN', '564': 'MN', '565': 'MN', '566': 'MN', '567': 'MN',
  // Mississippi: 38600-39799
  '386': 'MS', '387': 'MS', '388': 'MS', '389': 'MS', '390': 'MS', '391': 'MS', '392': 'MS', '393': 'MS', '394': 'MS', '395': 'MS', '396': 'MS', '397': 'MS',
  // Missouri: 63000-65999
  '630': 'MO', '631': 'MO', '632': 'MO', '633': 'MO', '634': 'MO', '635': 'MO', '636': 'MO', '637': 'MO', '638': 'MO', '639': 'MO', '640': 'MO', '641': 'MO', '642': 'MO', '643': 'MO', '644': 'MO', '645': 'MO', '646': 'MO', '647': 'MO', '648': 'MO', '649': 'MO', '650': 'MO', '651': 'MO', '652': 'MO', '653': 'MO', '654': 'MO', '655': 'MO', '656': 'MO', '657': 'MO', '658': 'MO', '659': 'MO',
  // Montana: 59000-59999
  '590': 'MT', '591': 'MT', '592': 'MT', '593': 'MT', '594': 'MT', '595': 'MT', '596': 'MT', '597': 'MT', '598': 'MT', '599': 'MT',
  // Nebraska: 68000-69399
  '680': 'NE', '681': 'NE', '682': 'NE', '683': 'NE', '684': 'NE', '685': 'NE', '686': 'NE', '687': 'NE', '688': 'NE', '689': 'NE', '690': 'NE', '691': 'NE', '692': 'NE', '693': 'NE',
  // Nevada: 89000-89899
  '890': 'NV', '891': 'NV', '892': 'NV', '893': 'NV', '894': 'NV', '895': 'NV', '896': 'NV', '897': 'NV', '898': 'NV',
  // New Hampshire: 03000-03899
  '030': 'NH', '031': 'NH', '032': 'NH', '033': 'NH', '034': 'NH', '035': 'NH', '036': 'NH', '037': 'NH', '038': 'NH',
  // New Jersey: 07000-08999
  '070': 'NJ', '071': 'NJ', '072': 'NJ', '073': 'NJ', '074': 'NJ', '075': 'NJ', '076': 'NJ', '077': 'NJ', '078': 'NJ', '079': 'NJ', '080': 'NJ', '081': 'NJ', '082': 'NJ', '083': 'NJ', '084': 'NJ', '085': 'NJ', '086': 'NJ', '087': 'NJ', '088': 'NJ', '089': 'NJ',
  // New Mexico: 87000-88499
  '870': 'NM', '871': 'NM', '872': 'NM', '873': 'NM', '874': 'NM', '875': 'NM', '876': 'NM', '877': 'NM', '878': 'NM', '879': 'NM', '880': 'NM', '881': 'NM', '882': 'NM', '883': 'NM', '884': 'NM',
  // New York: 10000-14999
  '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY', '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY', '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY', '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY', '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
  // North Carolina: 27000-28999
  '270': 'NC', '271': 'NC', '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC', '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
  // North Dakota: 58000-58999
  '580': 'ND', '581': 'ND', '582': 'ND', '583': 'ND', '584': 'ND', '585': 'ND', '586': 'ND', '587': 'ND', '588': 'ND',
  // Ohio: 43000-45999
  '430': 'OH', '431': 'OH', '432': 'OH', '433': 'OH', '434': 'OH', '435': 'OH', '436': 'OH', '437': 'OH', '438': 'OH', '439': 'OH', '440': 'OH', '441': 'OH', '442': 'OH', '443': 'OH', '444': 'OH', '445': 'OH', '446': 'OH', '447': 'OH', '448': 'OH', '449': 'OH', '450': 'OH', '451': 'OH', '452': 'OH', '453': 'OH', '454': 'OH', '455': 'OH', '456': 'OH', '457': 'OH', '458': 'OH', '459': 'OH',
  // Oklahoma: 73000-74999
  '730': 'OK', '731': 'OK', '732': 'OK', '733': 'OK', '734': 'OK', '735': 'OK', '736': 'OK', '737': 'OK', '738': 'OK', '739': 'OK', '740': 'OK', '741': 'OK', '742': 'OK', '743': 'OK', '744': 'OK', '745': 'OK', '746': 'OK', '747': 'OK', '748': 'OK', '749': 'OK',
  // Oregon: 97000-97999
  '970': 'OR', '971': 'OR', '972': 'OR', '973': 'OR', '974': 'OR', '975': 'OR', '976': 'OR', '977': 'OR', '978': 'OR', '979': 'OR',
  // Pennsylvania: 15000-19699
  '150': 'PA', '151': 'PA', '152': 'PA', '153': 'PA', '154': 'PA', '155': 'PA', '156': 'PA', '157': 'PA', '158': 'PA', '159': 'PA', '160': 'PA', '161': 'PA', '162': 'PA', '163': 'PA', '164': 'PA', '165': 'PA', '166': 'PA', '167': 'PA', '168': 'PA', '169': 'PA', '170': 'PA', '171': 'PA', '172': 'PA', '173': 'PA', '174': 'PA', '175': 'PA', '176': 'PA', '177': 'PA', '178': 'PA', '179': 'PA', '180': 'PA', '181': 'PA', '182': 'PA', '183': 'PA', '184': 'PA', '185': 'PA', '186': 'PA', '187': 'PA', '188': 'PA', '189': 'PA', '190': 'PA', '191': 'PA', '192': 'PA', '193': 'PA', '194': 'PA', '195': 'PA', '196': 'PA',
  // Rhode Island: 02800-02999
  '028': 'RI', '029': 'RI',
  // South Carolina: 29000-29999
  '290': 'SC', '291': 'SC', '292': 'SC', '293': 'SC', '294': 'SC', '295': 'SC', '296': 'SC', '297': 'SC', '298': 'SC', '299': 'SC',
  // South Dakota: 57000-57799
  '570': 'SD', '571': 'SD', '572': 'SD', '573': 'SD', '574': 'SD', '575': 'SD', '576': 'SD', '577': 'SD',
  // Tennessee: 37000-38599
  '370': 'TN', '371': 'TN', '372': 'TN', '373': 'TN', '374': 'TN', '375': 'TN', '376': 'TN', '377': 'TN', '378': 'TN', '379': 'TN', '380': 'TN', '381': 'TN', '382': 'TN', '383': 'TN', '384': 'TN', '385': 'TN',
  // Texas: 75000-79999, 88500-88599
  '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX', '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX', '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX', '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX', '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX', '885': 'TX',
  // Utah: 84000-84799
  '840': 'UT', '841': 'UT', '842': 'UT', '843': 'UT', '844': 'UT', '845': 'UT', '846': 'UT', '847': 'UT',
  // Vermont: 05000-05999
  '050': 'VT', '051': 'VT', '052': 'VT', '053': 'VT', '054': 'VT', '055': 'VT', '056': 'VT', '057': 'VT', '058': 'VT', '059': 'VT',
  // Virginia: 20100-20199, 22000-24699
  '201': 'VA', '220': 'VA', '221': 'VA', '222': 'VA', '223': 'VA', '224': 'VA', '225': 'VA', '226': 'VA', '227': 'VA', '228': 'VA', '229': 'VA', '230': 'VA', '231': 'VA', '232': 'VA', '233': 'VA', '234': 'VA', '235': 'VA', '236': 'VA', '237': 'VA', '238': 'VA', '239': 'VA', '240': 'VA', '241': 'VA', '242': 'VA', '243': 'VA', '244': 'VA', '245': 'VA', '246': 'VA',
  // Washington: 98000-99499
  '980': 'WA', '981': 'WA', '982': 'WA', '983': 'WA', '984': 'WA', '985': 'WA', '986': 'WA', '987': 'WA', '988': 'WA', '989': 'WA', '990': 'WA', '991': 'WA', '992': 'WA', '993': 'WA', '994': 'WA',
  // West Virginia: 24700-26899
  '247': 'WV', '248': 'WV', '249': 'WV', '250': 'WV', '251': 'WV', '252': 'WV', '253': 'WV', '254': 'WV', '255': 'WV', '256': 'WV', '257': 'WV', '258': 'WV', '259': 'WV', '260': 'WV', '261': 'WV', '262': 'WV', '263': 'WV', '264': 'WV', '265': 'WV', '266': 'WV', '267': 'WV', '268': 'WV',
  // Wisconsin: 53000-54999
  '530': 'WI', '531': 'WI', '532': 'WI', '533': 'WI', '534': 'WI', '535': 'WI', '536': 'WI', '537': 'WI', '538': 'WI', '539': 'WI', '540': 'WI', '541': 'WI', '542': 'WI', '543': 'WI', '544': 'WI', '545': 'WI', '546': 'WI', '547': 'WI', '548': 'WI', '549': 'WI',
  // Wyoming: 82000-83199
  '820': 'WY', '821': 'WY', '822': 'WY', '823': 'WY', '824': 'WY', '825': 'WY', '826': 'WY', '827': 'WY', '828': 'WY', '829': 'WY', '830': 'WY', '831': 'WY',
  // Washington DC: 20000-20099, 20200-20599
  '200': 'DC', '202': 'DC', '203': 'DC', '204': 'DC', '205': 'DC'
};

/**
 * Derives US state code from ZIP code
 */
export function deriveStateFromZipcode(zipcode: string): string | null {
  if (!zipcode || zipcode.length !== 5) {
    return null;
  }
  
  // Check 3-digit prefix first (most specific)
  const threeDigitPrefix = zipcode.substring(0, 3);
  if (ZIP_TO_STATE_MAP[threeDigitPrefix]) {
    return ZIP_TO_STATE_MAP[threeDigitPrefix];
  }
  
  // Check 2-digit prefix
  const twoDigitPrefix = zipcode.substring(0, 2);
  if (ZIP_TO_STATE_MAP[twoDigitPrefix]) {
    return ZIP_TO_STATE_MAP[twoDigitPrefix];
  }
  
  return null;
}

/**
 * Validates US ZIP code format
 */
export function isValidZipcode(zipcode: string): boolean {
  return /^\d{5}$/.test(zipcode);
}

/**
 * Validates golf handicap (allows negative for scratch/plus handicaps)
 */
export function isValidGolfHandicap(handicap: number): boolean {
  return handicap >= -10 && handicap <= 54; // Typical handicap range
}

/**
 * Retrieves the Firestore database instance.
 * Ensures that Firebase is available before attempting operations.
 * Throws an error if Firestore is not available.
 */
function getDb(): Firestore {
  const db = getFirestoreDB();
  if (!db) {
    console.error('Firestore DB is not available.');
    throw new Error('Database service is currently unavailable. Please try again later.');
  }
  return db;
}

/**
 * Creates a user profile document in Firestore if it doesn't already exist.
 * Populates the profile with provided user data.
 * Sets initial default values for preferences and review counts.
 * 
 * @param userData - An object containing uid, email, displayName, photoURL.
 * @returns Promise<boolean> - True if a new profile was created, false if it already existed.
 * @throws Throws an error if Firestore operation fails.
 */
export async function createUserProfile(userData: CreateUserProfileInput): Promise<boolean> {
  if (!userData?.uid) {
throw new Error('User data with UID is required to create a profile.');
}
  
  const db = getDb();
  const userRef = doc(db, 'users', userData.uid);

  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const newUserProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        id: userData.uid,
        email: userData.email || '', 
        displayName: userData.displayName || 'Walking Golfer', 
        photoURL: userData.photoURL || null,
        preferences: {
          emailNotifications: true,
          newsletterSubscribed: false,
        },
        reviewCount: 0,
        zipcode: null,
        emailVerified: false,
        welcomeEmailSent: false,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      };
      
      await setDoc(userRef, newUserProfile);
      console.log('Created new user profile for:', userData.uid);
      return true;
    } else {
      console.log('User profile already exists for:', userData.uid);
      const updateData: Partial<UserProfile> = {};
      const existingData = docSnap.data() as UserProfile;
      if (userData.displayName && existingData.displayName !== userData.displayName) {
        updateData.displayName = userData.displayName;
      }
      if (userData.photoURL !== undefined && existingData.photoURL !== userData.photoURL) {
        updateData.photoURL = userData.photoURL;
      }
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userRef, { 
          ...updateData,
          updatedAt: serverTimestamp()
        });
        console.log('Updated existing user profile with latest info:', userData.uid);
      }
      return false;
    }
  } catch (error) {
    console.error('Error creating/checking user profile:', error);
    throw new Error('Failed to create or verify user profile.');
  }
}

/**
 * Fetches a user profile document from Firestore.
 * 
 * @param userId - The ID of the user whose profile is to be fetched.
 * @returns Promise<UserProfile | null> - The user profile data or null if not found.
 * @throws Throws an error if Firestore operation fails.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('User ID is required to fetch profile.');
    return null;
  }
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data['createdAt'] as Timestamp)?.toDate ? (data['createdAt'] as Timestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: (data['updatedAt'] as Timestamp)?.toDate ? (data['updatedAt'] as Timestamp).toDate().toISOString() : new Date().toISOString(),
        lastReviewDate: (data['lastReviewDate'] instanceof Timestamp) ? (data['lastReviewDate'] as Timestamp).toDate().toISOString() : data['lastReviewDate'],
      } as UserProfile;
    } else {
      console.log('No user profile found for:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to retrieve user profile.');
  }
}

/**
 * Fetches a user profile document from Firestore using the ADMIN SDK.
 * Intended for use in server-side (admin) contexts.
 * 
 * @param userId - The ID of the user whose profile is to be fetched.
 * @returns Promise<UserProfile | null> - The user profile data or null if not found.
 * @throws Throws an error if Firestore operation fails.
 */
export async function getUserProfileAdmin(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('User ID is required to fetch profile (admin).');
    return null;
  }
  const dbAdmin = getAdminFirestore(); 
  // Use admin-compatible doc and getDoc. Since firebase-admin/firestore exports these directly,
  // and they operate on its own Firestore instance type, we can use them if we ensure dbAdmin is of that type.
  // The getAdminFirestore() from firebaseAdmin.ts should return the correct type.
  // The `doc` and `getDoc` imported at the top are from 'firebase/firestore' (client).
  // To avoid confusion and ensure type compatibility, let's use the full path or specific admin imports if possible.
  // However, the Firestore types themselves are different. We must use `doc` and `getDoc` that work with `AdminSDK.Firestore`.
  // The `firebase-admin/firestore` module itself provides these.
  // So, it's better to get `doc` and `getDoc` from the admin SDK when using the admin DB.
  // For now, let's assume the global `doc` and `getDoc` might resolve if types are compatible or aliased.
  // The linter error indicated they are not. So we must use specific admin versions of doc/getDoc.
  
  // Correct approach: firebase-admin functions are typically directly on the db instance or imported from firebase-admin/firestore.
  // Since `getAdminFirestore()` gives us the admin db, its `doc()` method should be used, or imported `doc` from `firebase-admin/firestore`.
  const userAdminRef = dbAdmin.collection('users').doc(userId); // Admin SDK style

  try {
    const docSnap = await userAdminRef.get(); // Admin SDK style
    if (docSnap.exists) {
      const data = docSnap.data() as DocumentData; // firebase-admin returns DocumentData
      return {
        ...data,
        id: docSnap.id,
        createdAt: (data['createdAt'] as AdminTimestamp)?.toDate ? (data['createdAt'] as AdminTimestamp).toDate().toISOString() : new Date().toISOString(),
        updatedAt: (data['updatedAt'] as AdminTimestamp)?.toDate ? (data['updatedAt'] as AdminTimestamp).toDate().toISOString() : new Date().toISOString(),
        lastReviewDate: (data['lastReviewDate'] instanceof AdminTimestamp) 
                        ? (data['lastReviewDate'] as AdminTimestamp).toDate().toISOString() 
                        : typeof data['lastReviewDate'] === 'string' 
                            ? data['lastReviewDate'] 
                            : null, 
      } as UserProfile;
    } else {
      console.log('No user profile found for (admin):', userId);
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile (admin):', error);
    throw new Error('Failed to retrieve user profile (admin).');
  }
}

/**
 * Updates a user profile document in Firestore.
 * 
 * @param userId - The ID of the user whose profile is to be updated.
 * @param data - An object containing the fields to update (Partial<UserProfile>).
 * @returns Promise<void>
 * @throws Throws an error if Firestore operation fails.
 */
export async function updateUserProfile(userId: string, data: UserProfileUpdate): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }
  if (!data || Object.keys(data).length === 0) {
    console.warn('Update user profile called with no data.');
    return;
  }
  
  const db = getDb();
  const userRef = doc(db, 'users', userId);
  
  try {
    // If zipcode is being updated, automatically derive homeState
    const updateData: any = { ...data };
    if (data.zipcode && isValidZipcode(data.zipcode)) {
      updateData.homeState = deriveStateFromZipcode(data.zipcode);
    }
    
    // Add timestamp
    updateData.updatedAt = serverTimestamp();
    
    await updateDoc(userRef, updateData);
    console.log('Successfully updated user profile for:', userId);
    
    // Sync to Klaviyo for marketing purposes (non-blocking, server-side only)
    try {
      console.log('Syncing profile update to Klaviyo...');
      await syncUserProfileToKlaviyo(userId, updateData);
      console.log('Klaviyo sync completed for profile update');
    } catch (klaviyoError) {
      console.warn('Failed to sync profile update to Klaviyo:', klaviyoError);
      // Don't fail the profile update for Klaviyo sync issues
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile.');
  }
}

/**
 * Updates user profile data in Firestore using Admin SDK (server-side)
 */
export async function updateUserProfileAdmin(userId: string, data: UserProfileUpdate): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to update profile.');
  }
  if (!data || Object.keys(data).length === 0) {
    console.warn('Update user profile called with no data.');
    return;
  }
  
  try {
    const adminDb = getAdminFirestore();
    const userRef = adminDb.collection('users').doc(userId);
    
    // If zipcode is being updated, automatically derive homeState
    const updateData: any = { ...data };
    if (data.zipcode && isValidZipcode(data.zipcode)) {
      updateData.homeState = deriveStateFromZipcode(data.zipcode);
    }
    
    // Add timestamp using Admin SDK
    updateData.updatedAt = AdminTimestamp.now();
    
    await userRef.update(updateData);
    console.log('Successfully updated user profile for (admin):', userId);
    
    // Sync to Klaviyo for marketing purposes (non-blocking)
    try {
      console.log('Syncing profile update to Klaviyo...');
      await syncUserProfileToKlaviyo(userId, updateData);
      console.log('Klaviyo sync completed for profile update');
    } catch (klaviyoError) {
      console.warn('Failed to sync profile update to Klaviyo:', klaviyoError);
      // Don't fail the profile update for Klaviyo sync issues
    }
  } catch (error) {
    console.error('Error updating user profile (admin):', error);
    throw new Error('Failed to update user profile.');
  }
}

/**
 * Completes a user profile with enhanced data from the profile completion form
 */
export async function completeUserProfile(userId: string, profileData: ProfileCompletionData): Promise<void> {
  console.log('completeUserProfile called with userId:', userId);
  console.log('profileData:', profileData);
  
  if (!userId) {
    throw new Error('User ID is required to complete profile.');
  }
  
  // Validate required fields
  if (!profileData.firstName || !profileData.lastName || !profileData.zipcode) {
    console.error('Validation failed - missing required fields:', {
      firstName: !!profileData.firstName,
      lastName: !!profileData.lastName,
      zipcode: !!profileData.zipcode
    });
    throw new Error('First name, last name, and ZIP code are required to complete profile.');
  }
  
  if (!isValidZipcode(profileData.zipcode)) {
    throw new Error('Please enter a valid 5-digit US ZIP code.');
  }
  
  if (profileData.golfHandicap !== undefined && !isValidGolfHandicap(profileData.golfHandicap)) {
    throw new Error('Golf handicap must be between -10 and 54.');
  }
  
  const homeState = deriveStateFromZipcode(profileData.zipcode);
  if (!homeState) {
    throw new Error('Unable to determine state from ZIP code. Please verify your ZIP code.');
  }
  
  const updateData: UserProfileUpdate = {
    firstName: profileData.firstName,
    lastName: profileData.lastName,
    displayName: `${profileData.firstName} ${profileData.lastName}`,
    golfingExperience: profileData.golfingExperience,
    preferredCarryMethod: profileData.preferredCarryMethod,
    zipcode: profileData.zipcode,
    homeState,
    favoriteStates: profileData.favoriteStates || [],
    marketingConsent: profileData.marketingConsent,
    profileCompleted: true,
    profileCompletedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add optional fields only if they have values
  if (profileData.dateOfBirth) {
    updateData.dateOfBirth = profileData.dateOfBirth;
  }
  
  if (profileData.golfHandicap !== undefined) {
    updateData.golfHandicap = profileData.golfHandicap;
  }
  
  console.log('About to call updateUserProfile with:', updateData);
  await updateUserProfile(userId, updateData);
  console.log('updateUserProfile completed successfully');
  
  // Sync to Klaviyo for marketing purposes (only on server-side)
  try {
    console.log('Syncing to Klaviyo...');
    await syncUserProfileToKlaviyo(userId, updateData);
    console.log('Klaviyo sync completed');
  } catch (error) {
    console.warn('Failed to sync profile to Klaviyo:', error);
    // Don't fail the profile completion for this
  }
}

/**
 * Syncs user profile data to Klaviyo for marketing and personalization
 */
export async function syncUserProfileToKlaviyo(userId: string, profileData?: UserProfileUpdate): Promise<void> {
  try {
    // Skip Klaviyo sync on client-side (environment variable not available)
    if (typeof window !== 'undefined') {
      console.log('Skipping Klaviyo sync on client-side');
      return;
    }

    // Check if Klaviyo API key is available
    if (!process.env['KLAVIYO_PRIVATE_KEY']) {
      console.log('Klaviyo API key not available - skipping sync');
      return;
    }

    // Dynamic import to avoid circular dependencies
    const { getKlaviyoClient, createKlaviyoProfile, KlaviyoEvents } = await import('@/lib/klaviyo');
    
    // Get the full user profile (use Admin SDK on server-side)
    const userProfile = await getUserProfileAdmin(userId);
    if (!userProfile || !userProfile.email) {
      console.warn('Cannot sync to Klaviyo: user profile not found or missing email');
      return;
    }

    const klaviyoClient = getKlaviyoClient();
    
    // Create enhanced Klaviyo profile
    const klaviyoProfile = createKlaviyoProfile(
      userProfile.email,
      userProfile.displayName,
      userProfile
    );

    // Update Klaviyo profile
    const profileId = await klaviyoClient.createOrUpdateProfileAttributes(klaviyoProfile);
    
    if (profileId) {
      console.log(`Successfully synced user ${userId} profile to Klaviyo`);
      
      // Track profile completion event if this was a completion
      if (profileData?.profileCompleted) {

        
        await klaviyoClient.trackEvent(
          KlaviyoEvents.PROFILE_COMPLETED,
          userProfile.email,
          {
            golf_experience: userProfile.golfingExperience,
            preferred_carry_method: userProfile.preferredCarryMethod,
            home_state: userProfile.homeState,
            zip: userProfile.zipcode,
            golf_handicap: userProfile.golfHandicap,
            favorite_states: userProfile.favoriteStates,
            completion_date: new Date().toISOString()
          }
        );
      } else if (profileData && Object.keys(profileData).length > 1) { // More than just updatedAt
        // Track profile update event for regular updates
        const updatedFields = Object.keys(profileData).filter(key => key !== 'updatedAt');
        
        await klaviyoClient.trackEvent(
          KlaviyoEvents.PROFILE_UPDATED,
          userProfile.email,
          {
            updated_fields: updatedFields,
            golf_experience: userProfile.golfingExperience,
            preferred_carry_method: userProfile.preferredCarryMethod,
            home_state: userProfile.homeState,
            zip: userProfile.zipcode,
            golf_handicap: userProfile.golfHandicap,
            favorite_states: userProfile.favoriteStates,
            update_date: new Date().toISOString()
          }
        );
        console.log(`Tracked profile update event for fields: ${updatedFields.join(', ')}`);
      }
      
      // Handle marketing consent changes (always sync if provided)
      if (profileData?.marketingConsent !== undefined) {
        await klaviyoClient.setProfileMarketingConsent(userProfile.email, profileData.marketingConsent);
        console.log(`Updated marketing consent to: ${profileData.marketingConsent}`);
      } else if (userProfile.marketingConsent !== undefined) {
        // Sync existing consent status on profile updates
        await klaviyoClient.setProfileMarketingConsent(userProfile.email, userProfile.marketingConsent);
      }
    }
  } catch (error) {
    console.error('Error syncing profile to Klaviyo:', error);
    throw error; // Re-throw so caller can handle
  }
}

/**
 * Gets profile completion percentage based on filled fields
 */
export function getProfileCompletionPercentage(profile: UserProfile): number {
  const requiredFields = [
    'firstName',
    'lastName', 
    'zipcode',
    'golfingExperience',
    'preferredCarryMethod'
  ];
  
  const optionalFields = [
    'dateOfBirth',
    'golfHandicap',
    'favoriteStates',
    'reviewDisplayNameType'
  ];
  
  let completed = 0;
  const totalFields = requiredFields.length + optionalFields.length;
  
  // Check required fields (worth more weight)
  requiredFields.forEach(field => {
    if (profile[field as keyof UserProfile]) {
      completed += 1.5; // Required fields worth more
    }
  });
  
  // Check optional fields
  optionalFields.forEach(field => {
    const value = profile[field as keyof UserProfile];
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        completed += 1;
      } else if (!Array.isArray(value)) {
        completed += 1;
      }
    }
  });
  
  const maxPossibleScore = (requiredFields.length * 1.5) + optionalFields.length;
  return Math.round((completed / maxPossibleScore) * 100);
}

/**
 * Uploads a profile photo for a user and updates their profile
 */
export async function uploadUserProfilePhoto(userId: string, file: File): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required to upload profile photo.');
  }
  
  if (!file) {
    throw new Error('File is required to upload profile photo.');
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed for profile photos.');
  }
  
  // Validate file size (5MB limit)
  const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeInBytes) {
    throw new Error('Profile photo must be less than 5MB.');
  }
  
  try {
    // Get current profile to check for existing photo
    const currentProfile = await getUserProfile(userId);
    const oldPhotoURL = currentProfile?.photoURL;
    
    // Upload new photo to Firebase Storage
    const photoPath = `profiles/${userId}`;
    const photoURL = await uploadImage(file, photoPath);
    
    // Update user profile with new photo URL
    await updateUserProfile(userId, { photoURL });
    
    // Delete old photo if it exists and is a Firebase Storage URL
    if (oldPhotoURL && oldPhotoURL.includes('firebasestorage.googleapis.com')) {
      try {
        await deleteImage(oldPhotoURL);
        console.log('Successfully deleted old profile photo');
      } catch (deleteError) {
        console.warn('Failed to delete old profile photo:', deleteError);
        // Don't fail the upload for this
      }
    }
    
    console.log('Successfully uploaded profile photo for user:', userId);
    return photoURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw new Error('Failed to upload profile photo. Please try again.');
  }
}

export async function getUserReviews(userId: string): Promise<CourseReview[]> {
  try {
    const reviews = await getDocuments('reviews'); // Uses client SDK via firebaseUtils
    const userReviews = reviews.filter(review => review.userId === userId);
    return userReviews.map(review => ({
        ...review,
        // Ensure Timestamps are handled correctly if they come from client SDK
        createdAt: (review.createdAt instanceof ClientTimestamp) 
                        ? review.createdAt.toDate() 
                        : typeof review.createdAt === 'string' 
                            ? new Date(review.createdAt) 
                            : review.createdAt, // Assuming it is already a Date object
        updatedAt: (review.updatedAt instanceof ClientTimestamp) 
                        ? review.updatedAt.toDate() 
                        : typeof review.updatedAt === 'string' 
                            ? new Date(review.updatedAt) 
                            : review.updatedAt, // Assuming it is already a Date object or null
        walkingDate: (review.walkingDate instanceof ClientTimestamp) 
                        ? review.walkingDate.toDate() 
                        : review.walkingDate === null 
                            ? null 
                            : typeof review.walkingDate === 'string' 
                                ? new Date(review.walkingDate) 
                                : review.walkingDate, // Assuming it is already a Date object or null
    })) as CourseReview[];
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
}

