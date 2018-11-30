let contract_ABI = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_songHash",
				"type": "bytes32"
			}
		],
		"name": "addSong",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_songHash",
				"type": "bytes32"
			},
			{
				"name": "user",
				"type": "address"
			},
			{
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "getSong",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "_songHash",
				"type": "bytes32"
			},
			{
				"name": "user",
				"type": "address"
			}
		],
		"name": "approveSong",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "_songHash",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "user",
				"type": "address"
			}
		],
		"name": "Approve",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "_songHash",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"name": "user",
				"type": "address"
			},
			{
				"indexed": false,
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "Distributed",
		"type": "event"
	}
];

let contract_Address = '0x28d3d18152d18d4efad0eee33c69cf64511ac6d6';
