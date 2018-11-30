/* global location */
'use strict'

const IPFS = require('ipfs')
const Web3 = require('web3')
const myStorage = window.localStorage

// Node
const $userName = document.querySelector('.user-id')
const $userAddress = document.querySelector('.user-addresses')
const $logs1 = document.querySelector('.logs1')
const $logs2 = document.querySelector('.logs2')
// Songs
const $songs = document.querySelector('#mySongs')
const $songsList = $songs.querySelector('tbody')
const $multiaddrInput = document.querySelector('#multiaddr-input')
const $buyButton = document.querySelector('#buy-btn')
const $songName = document.querySelector('#songName')
const $songPrice = document.querySelector('#songPrice')
// Files
const $multihashInput = document.querySelector('#multihash-input')
// const $fetchButton = document.querySelector('#fetch-btn')
const $dragContainer = document.querySelector('#drag-container')
const $progressBar = document.querySelector('#progress-bar')
const $fileHistory = document.querySelector('#file-history tbody')
const $emptyRow = document.querySelector('.empty-row')
// Misc
const $allDisabledButtons = document.querySelectorAll('button:disabled')
const $allDisabledInputs = document.querySelectorAll('input:disabled')
const $allDisabledElements = document.querySelectorAll('.disabled')

const FILES = []
const workspace = location.hash

let fileSize = 0

let node
let info
let Buffer
let USER_ADDRESS
let USER_NAME
let WEB3

let USER_LIST = JSON.parse(myStorage.getItem('users'))
//user structure
//address : id, songs own, songs uploaded
//song structure
// hash: name, creator, timestamp, downloads, price
let SONG_LIST

// contract
let contractABI = contract_ABI
let contractAddress = contract_Address
let CONTRACT

/* ===========================================================================
   Start the IPFS node
   =========================================================================== */

function start (addr) {
  USER_ADDRESS = addr
  console.log(USER_ADDRESS)

  if (USER_LIST == null) {
    let username = window.prompt("Please enter your user name")
    USER_LIST = {}
    USER_LIST[USER_ADDRESS] = {
      'name': username,
      'owns': [],
      'uploaded': []
    }
    myStorage.setItem('users', JSON.stringify(USER_LIST));
  }
  if (USER_LIST[USER_ADDRESS] === undefined) {
    let username = window.prompt("Please enter your user name")
    USER_LIST[USER_ADDRESS] = {
      'name': username,
      'owns': [],
      'uploaded': []
    }
    myStorage.setItem('users', JSON.stringify(USER_LIST));
  }

  USER_NAME = USER_LIST[USER_ADDRESS][name]

  initSongList()

  if (!node) {
    const options = {
      EXPERIMENTAL: {
        pubsub: true
      },
      repo: 'ipfs-' + USER_ADDRESS,
      config: {
        Addresses: {
          Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
        }
      }
    }

    node = new IPFS(options)

    Buffer = node.types.Buffer

    node.once('start', () => {
      node.id()
        .then((id) => {
          info = id
          updateView('ready', node)
          onSuccess('Service is ready.')
          setInterval(sendFileList, 100)
        })
        .catch((error) => onError(error))

      // subscribeToWorkpsace()
    })
  }
}

function initSongList() {
  SONG_LIST = JSON.parse(myStorage.getItem('songs'))
  if (USER_LIST == null) {
    SONG_LIST = {}
  }
  myStorage.setItem('users', JSON.stringify(USER_LIST));
}

/* ===========================================================================
   Pubsub
   =========================================================================== */

// const messageHandler = (message) => {
//   const myNode = info.id
//   const hash = message.data.toString()
//   const messageSender = message.from

//   // append new files when someone uploads them
//   if (myNode !== messageSender && !isFileInList(hash)) {
//     $multihashInput.value = hash
//     getFile()
//   }
// }

// const subscribeToWorkpsace = () => {
//   node.pubsub.subscribe(workspace, messageHandler)
//     .catch(() => onError('An error occurred when subscribing to the workspace.'))
// }

// const publishHash = (hash) => {
//   const data = Buffer.from(hash)

//   node.pubsub.publish(workspace, data)
//     .catch(() => onError('An error occurred when publishing the message.'))
// }

/* ===========================================================================
   Files handling
   =========================================================================== */

// const isFileInList = (hash) => FILES.indexOf(hash) !== -1

// const sendFileList = () => FILES.forEach((hash) => publishHash(hash))

const updateProgress = (bytesLoaded) => {
  let percent = 100 - ((bytesLoaded / fileSize) * 100)

  $progressBar.style.transform = `translateX(${-percent}%)`
}

const resetProgress = () => {
  $progressBar.style.transform = 'translateX(-100%)'
}

function appendFile (table, hash, fileObj, data ) {
  const file = new window.Blob([data], { type: 'application/octet-binary' })
  console.log(file)
  const url = window.URL.createObjectURL(file)
  const row = document.createElement('tr')

  const nameCell = document.createElement('td')
  nameCell.innerHTML = fileObj.name

  const hashCell = document.createElement('td')
  hashCell.innerHTML = hash

  const sizeCell = document.createElement('td')
  sizeCell.innerText = fileObj.downloads

  const timeCell = document.createElement('td')
  timeCell.innerText = fileObj.timestamp

  const downloadCell = document.createElement('td')
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', fileObj.name)
  link.innerHTML = '<img width=20 class="table-action" src="images/download.svg" alt="Download" />'
  downloadCell.appendChild(link)

  row.appendChild(nameCell)
  row.appendChild(hashCell)
  row.appendChild(sizeCell)
  row.appendChild(timeCell)
  row.appendChild(downloadCell)

  if (table == 'explore') {
    $fileHistory.insertBefore(row, $fileHistory.firstChild)
  } else {
    $fileHistory.insertBefore(row, $fileHistory.firstChild)
  }
  // publishHash(hash)
}

function getFile () {
  const hash = $multihashInput.value

  $multihashInput.value = ''

  if (!hash) {
    return onError('No multihash was inserted.')
  } else if (isFileInList(hash)) {
    return onSuccess('The file is already in the current workspace.')
  }

  FILES.push(hash)

  node.files.get(hash)
    .then((files) => {
      files.forEach((file) => {
        if (file.content) {
          appendFile(file.name, hash, file.size, file.content)
          onSuccess(`The ${file.name} file was added.`)
          $emptyRow.style.display = 'none'
        }
      })
    })
    .catch(() => onError('An error occurred when fetching the files.'))
}

/* Drag & Drop
   =========================================================================== */

const onDragEnter = () => $dragContainer.classList.add('dragging')

const onDragLeave = () => $dragContainer.classList.remove('dragging')

function onDrop (event) {

  onDragLeave()
  event.preventDefault()

  if ($songName.value.length == 0 || $songPrice.value.length == 0) {
    return onError2('Invalid song name or song price')
  }

  const dt = event.dataTransfer
  const filesDropped = dt.files[0]

  function readFileContents (file) {
    return new Promise((resolve) => {
      const reader = new window.FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.readAsArrayBuffer(file)
    })
  }

  const files = []
  for (let i = 0; i < filesDropped.length; i++) {
    files.push(filesDropped[i])
  }

  files.forEach((file) => {
    readFileContents(file).then((buffer) => {
      fileSize = file.size
      console.log("file name is " + file.name)
      node.files.add({
        path: file.name,
        content: Buffer.from(buffer)
      }, { wrap: true, progress: updateProgress }, (err, filesAdded) => {
        if (err) {
          return onError(err)
        }

        // As we are wrapping the content we use that hash to keep
        // the original file name when adding it to the table
        $multihashInput.value = filesAdded[1].hash
        let songHash = filesAdded[1].hash

        // add song in smart contract
        CONTRACT.methods.addSong(songHash).send({from: USER_ADDRESS}).then(
          function() {
            SONG_LIST[songHash] = {
              name: $songName.value,
              creator: USER_ADDRESS,
              timestamp: Date.now(),
              downloads: 0,
              price: $songPrice.value
            }
            myStorage.setItem(JSON.stringify(SONG_LIST))
          }
        )

        onSuccess2('Upload succeeded!')
        refreshExploreList()
        resetProgress()
        // getFile()
      })
    })
    .catch(onError)
  })
}

/* ===========================================================================
   Songs handling
   =========================================================================== */
function purchaseSong () {
  const songHash = $multiaddrInput.value
  if (!multiaddr) {
    return onError('No song hash was inserted.')
  }

  if (SONG_LIST[songHash] === undefined) {
    return onError('Invalid song hash was inserted.')
  }
  let creator = SONG_LIST[songHash].creator
  let price = SONG_LIST[songHash].price

  CONTRACT.methods.approveSong(songHash, USER_ADDRESS).send({from: creator}).then(
    function(){
    CONTRACT.methods.getSong(songHash, USER_ADDRESS, price).send(
      {
        from: USER_ADDRESS,
        value: web3.utils.toWei(price,"ether")
      }).then(
      onSuccess('Song purchased')
      refreshSongList()
  });
}

function refreshSongList () {
  // TODO
  // send get songs request to contract
  `<tr><td>${addr}</td></tr>`
}

function refreshExploreList(){

}

/* ===========================================================================
   Error handling
   =========================================================================== */

function onSuccess (msg) {
  $logs.classList.add('success')
  $logs.innerHTML = msg
}

function onError (err, class='log1') {
  let msg = 'An error occured, check the dev console'

  if (err.stack !== undefined) {
    msg = err.stack
  } else if (typeof err === 'string') {
    msg = err
  }

  $logs.classList.remove('success')
  $logs.innerHTML = msg
}

function onSuccess2 (msg) {
  $logs2.classList.add('success')
  $logs2.innerHTML = msg
}

function onError2 (err, class='log1') {
  let msg = 'An error occured, check the dev console'

  if (err.stack !== undefined) {
    msg = err.stack
  } else if (typeof err === 'string') {
    msg = err
  }

  $logs2.classList.remove('success')
  $logs2.innerHTML = msg
}


/* ===========================================================================
   App states
   =========================================================================== */

const states = {
  ready: () => {
    const addressesHtml = info.addresses.map((address) => {
      return `<li><pre>${address}</pre></li>`
    }).join('')
    $userName.innerText = USER_NAME
    $userAddress.innerHTML = USER_ADDRESS
    $allDisabledButtons.forEach(b => { b.disabled = false })
    $allDisabledInputs.forEach(b => { b.disabled = false })
    $allDisabledElements.forEach(el => { el.classList.remove('disabled') })
  }
}

function updateView (state, ipfs) {
  if (states[state] !== undefined) {
    states[state]()
  } else {
    throw new Error('Could not find state "' + state + '"')
  }
}

function w3(callback) {
  //0xf874d9aDE60F6CD416b8E968F7C3B9524b2505AF
  console.log(web3.currentProvider)
  if (typeof web3 !== 'undefined') {
    // Use Mist/MetaMask's provider
    WEB3 = new Web3(web3.currentProvider);
  } else {
    console.log('No web3? You should consider trying MetaMask!')
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    WEB3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8555"));
  }

  CONTRACT = new WEB3.eth.Contract(contractABI, contractAddress)

  WEB3.eth.getAccounts().then(e => callback(e[0]))

}

/* ===========================================================================
   Boot the app
   =========================================================================== */

const startApplication = () => {
  // Setup event listeners
  $dragContainer.addEventListener('dragenter', onDragEnter)
  $dragContainer.addEventListener('dragover', onDragEnter)
  $dragContainer.addEventListener('drop', onDrop)
  $dragContainer.addEventListener('dragleave', onDragLeave)
  // $fetchButton.addEventListener('click', getFile)
  $buyButton.addEventListener('click', refreshSongList)




  w3(start)

}

startApplication()
