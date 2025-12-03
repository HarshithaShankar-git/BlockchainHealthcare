// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PatientRecords {
    struct Record {
        string patientName;
        string data;      // Could be JSON or IPFS hash
        uint timestamp;
    }

    mapping(address => Record[]) private records;
    mapping(address => bool) public doctors;

    address public admin;

    constructor() {
        admin = msg.sender;  // Contract deployer is admin
    }

    // Register a new doctor (only admin)
    function registerDoctor(address _doctor) public {
        require(msg.sender == admin, "Only admin can register doctors");
        doctors[_doctor] = true;
    }

    // Add medical record (only doctors)
    function addRecord(address _patient, string memory _name, string memory _data) public {
        require(doctors[msg.sender], "Only registered doctors can add records");
        records[_patient].push(Record(_name, _data, block.timestamp));
    }

    // View records (any patient can view their own records)
    function getRecords(address _patient) public view returns (Record[] memory) {
        require(msg.sender == _patient || doctors[msg.sender], "Access denied");
        return records[_patient];
    }
}
