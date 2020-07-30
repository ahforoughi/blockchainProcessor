const pb = require("protobufjs");
const {
  createPatAddress,
  createDocAddress,
  createDRUGAddress,
} = require("../addressing/address");
const { logger } = require("./logger");

class BC98State {
  constructor(context) {
    this.context = context;
    this.addressCache = new Map([]);
    this.users = ["PATEINT", "DOCTOR", "DRUGSTR"];
  }

  encodeFunction(payload, pathFile, pathMessage) {
    try {
      const root = pb.loadSync(pathFile);
      const file = root.lookup(pathMessage);
      let message = [];
      let data = [];
      payload.forEach((element, index) => {
        message.push(file.create(element));
        data[index] = file.encode(message[index]).finish();
      });
      return data;
    } catch (err) {
      const message = err.message ? err.message : err;
      logger.error("Something bad happened while encodeing:" + " " + message);
      throw new Error("Something bad happened while encodeing:" + " " + err);
    }
  }

  // //////////////////////////////////////////////////////////////////////
  // ########## Load and Get Messages #######################
  // /////////////////////////////////////////////////////////////////////

  loadMessage(key, pathFile, pathMessage) {
    let address;
    switch (pathMessage) {
      case "Patient":
        address = createPatAddress(key);
        break;
      case "Doctor":
        address = createDocAddress(key);
        break;
      case "DrugStore":
        address = createDRUGAddress(key);
        break;
      default:
        logger.warn("Bad Message!");
        break;
    }
    if (this.addressCache.has(address)) {
      if (this.addressCache.get(address) === null) {
        return Promise.resolve(new Map([]));
      } else {
        return Promise.resolve(
          pb
            .load(pathFile)
            .then((root) => {
              let map = new Map([]);
              const file = root.lookup(pathMessage);
              const dec = file.decode(this.addressCache.get(address));
              const decObject = file.toObject(dec);
              return map.set(address, decObject);
            })
            .catch((err) => {
              const message = err.message ? err.message : err;
              logger.error(`${pathFile} is not loading!: ${message}`);
              throw new Error(`${pathFile} is not loading!:` + " " + err);
            })
        );
      }
    } else {
      return this.context
        .getState([address])
        .then((addressValue) => {
          if (!addressValue[address]) {
            this.addressCache.set(address, null);
            return Promise.resolve(new Map([]));
          } else {
            let data = addressValue[address];
            this.addressCache.set(address, data);
            return pb
              .load(pathFile)
              .then((root) => {
                var map = new Map([]);
                const file = root.lookup(pathMessage);
                const dec = file.decode(data);
                const decObject = file.toObject(dec);
                return map.set(address, decObject);
              })
              .catch((err) => {
                const message = err.message ? err.message : err;
                logger.error(`${pathFile} is not loading!: ${message}`);
                throw new Error(`${pathFile} is not loading!:` + " " + err);
              });
          }
        })
        .catch((err) => {
          const message = err.message ? err.message : err;
          logger.error(`getState in blockchain is not responding!: ${message}`);
          throw new Error(
            "getState in blockchain is not responding!:" + " " + err
          );
        });
    }
  }

  getMessage(key, pathMessage) {
    let address;
    let pathFile;
    switch (pathMessage) {
      case "Patient":
        address = createPatAddress(key);
        pathFile = "../protos/patient.proto";
        break;
      case "Doctor":
        address = createDocAddress(key);
        pathFile = "../protos/doctor.proto";
        break;
      case "drugStore":
        address = createDRUGAddress(key);
        pathFile = "../protos/drugstore.proto";
        break;
      default:
        logger.warn("Bad Message!");
        break;
    }
    return this.loadMessage(key, pathFile, pathMessage)
      .then((elements) => elements.get(address))
      .catch((err) => {
        const message = err.message ? err.message : err;
        logger.error(`loadMessage has some problems: ${message}`);
        throw new Error("loadMessage has some problems:" + " " + err);
      });
  }

  // //////////////////////////////////////////////////////////////////////
  // ########## Set Accounts #######################
  // /////////////////////////////////////////////////////////////////////

  setAccount(label, pubKey) {
    // 0: patient
    // 1: doctor
    // 2: drugstore

    //define labels and save publicKey for each users
    if (label === this.users[0]) {
      // 0: patient
      try {
        const payloadPat = {
          publicKey: pubKey,
          label: [label],
          medicalRecords: new Array(),
          receivedPrescripts: new Array(),
        };
        const dataAccount = this.encodeFunction(
          [payloadPat],
          "../protos/patient.proto",
          "patientAccount"
        );
        const addressAccount = createPatAddress(pubKey);
        this.addressCache.set(addressAccount, dataAccount[0]);

        let entries = {
          [addressAccount]: dataAccount[0],
        };
        return this.context.setState(entries);
      } catch (err) {
        const message = err.message ? err.message : err;
        logger.error(`setState in set patient has some problems: ${message}`);
        throw new Error(
          "setState in set patient has some problems:" + " " + err
        );
      }
    } else if (label === this.users[1]) {
      // 1: doctor
      try {
        const payloadDoc = {
          publicKey: pubKey,
          label: [label],
          sentPrescripts: new Array(),
        };
        const dataAccount = this.encodeFunction(
          [payloadDoc],
          "../protos/doctor.proto",
          "doctorAccount"
        );
        const addressAccount = createDocAddress(pubKey);
        this.addressCache.set(addressAccount, dataAccount[0]);

        let entries = {
          [addressAccount]: dataAccount[0],
        };
        return this.context.setState(entries);
      } catch (err) {
        const message = err.message ? err.message : err;
        logger.error(`setState in set doctor has some problems: ${message}`);
        throw new Error(
          "setState in set doctor has some problems:" + " " + err
        );
      }
    } else if (label === this.users[2]) {
      // 2: drugstore
      try {
        const payloadStr = {
          publicKey: pubKey,
          label: [label],
          receivedPrescripts: new Array(),
        };
        const dataAccount = this.encodeFunction(
          [payloadStr],
          "../protos/drugstore.proto",
          "drugStoreAccount"
        );
        const addressAccount = createDRUGAddress(pubKey);
        this.addressCache.set(addressAccount, dataAccount[0]);

        let entries = {
          [addressAccount]: dataAccount[0],
        };
        return this.context.setState(entries);
      } catch (err) {
        const message = err.message ? err.message : err;
        logger.error(`setState in set drugstore has some problems: ${message}`);
        throw new Error(
          "setState in set drugstore has some problems:" + " " + err
        );
      }
    }
  }

  // //////////////////////////////////////////////////////////////////////
  // ########## Set Charge #######################
  // /////////////////////////////////////////////////////////////////////

  setCharge(amount, pubKey) {
    return this.getMessage(pubKey, "Account")
      .then((accountValue) => {
        if (!accountValue || accountValue.publickey !== pubKey) {
          logger.error("No Account exists in setCharge!");
          throw new Error("The Account is not valid!");
        }

        const balance = (Number(accountValue.balance) + Number(amount)).toFixed(
          3
        );

        const payloadAccount = {
          publickey: accountValue.publickey,
          label: accountValue.label,
          balance: balance,
        };

        const dataAccount = this.encodeFunction(
          [payloadAccount],
          "../protos/account.proto",
          "Account"
        );

        const addressAccount = createAccountAddress(pubKey);

        this.addressCache.set(addressAccount, dataAccount[0]);

        let entries = {
          [addressAccount]: dataAccount[0],
        };
        logger.info("The balance is changing to: " + balance);
        return this.context.setState(entries);
      })
      .catch((err) => {
        let message = err.message ? err.message : err;
        logger.error(`getAccount in blockchain is not responding!: ${message}`);
        throw new Error(
          "getAccount in blockchain is not responding!:" + " " + err
        );
      });
  }

  prescriptTrx(link, recieverPubKey, senderPubKey) {}

  // TODO this method is for assining sent prescript to doctor if this method works
  // apply this for addind hash for patient
  fromDoctor(prescriptHash, prescriptIndex, docPublicKey, patPublicKey) {
    return this.getMessage(docPublicKey, "Doctor")
      .then((accountValue) => {
        if (!accountValue || accountValue.publicKey !== docPublicKey) {
          logger.error("No Account exists in doctors!");
          throw new Error("The doctor Account is not valid!");
        }

        const doctorPayload = {
          publicKey: accountValue.publicKey,
          label: accountValue.label,
          sentPrescripts: sentPrescripts.add({
            index: prescriptIndex,
            hash: prescriptHash,
            patPublicKey: patPublicKey,
            docPublicKey: docPublicKey,
          }),
        };

        const dataAccount = this.encodeFunction(
          [doctorPayload],
          "../protos/doctor.proto",
          "doctorAccount"
        );

        const addressAccount = createAccountAddress(docPublicKey);

        this.addressCache.set(addressAccount, dataAccount[0]);

        let entries = {
          [addressAccount]: dataAccount[0],
        };
        logger.info(`prescript with hash: ${prescriptHash} and index: ${prescriptIndex}
                    has added to doctor with pulicKey: ${docPublicKey}`);
        return this.context.setState(entries);
      })
      .catch((err) => {
        let message = err.message ? err.message : err;
        logger.error(`getAccount in blockchain is not responding!: ${message}`);
        throw new Error(
          "getAccount in blockchain is not responding!:" + " " + err
        );
      });
  }
}

module.exports = {
  BC98State,
};
