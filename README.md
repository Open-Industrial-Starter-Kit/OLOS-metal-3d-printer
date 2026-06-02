<div align="center"><h1 style=align="center">Open Lab Operating System</h1></div>
<div align="center"><i>Open Source Operating System for Open Source Digital Fabrication Machines

</i></div>

## 1. OLOS Interface

**_OLOS Interface_** is a web-based platform that allows users to interact with the machines in real-time. Please refer to the full documentation located in the `OLOS_Interface` directory. It contains detailed information and how to set up the interface.

## 2. OLOS Server

**_OLOS Server_** is the central hub between the OLOS frontend and physical machines. The server is written in Python, utilizing multiprocessing and shared memory technologies. Please refer to the full documentation located in the `OLOS_Server` directory. It contains detailed information and how to install and set up the server.

## Running the Whole System:

1. **Machine Controller** – Ensure the machine’s controller is flashed with **GRBLHAL firmware**, specifically the [RP2040](https://github.com/grblHAL/RP2040) variant, before starting the system.
2. **Start the OLOS Server** – Launch the backend server responsible for handling machine control, processing requests, and managing WebSocket communication.
3. **Start the OLOS Interface** – Run the frontend interface to interact with the system.

**Note:** The **FASTAPI** and **WebSocket** connection settings must match between the server and the interface for proper communication.

---

## Author

Open Lab Operating System has been developed by **[InMachines Ingrassia GmbH](https://www.inmachines.net/)**.

<img src="https://irp.cdn-website.com/2b5ccdcd/dms3rep/multi/InMachines_Logo_positive_white.png" width="50%">

<br>

Software Development:

- **[Daniele Ingrassia](https://www.linkedin.com/in/danieleingrassia/)**
- **[Sulaiman Tanbari](https://www.linkedin.com/in/mohammad-sulaiman-tanbari/)**

The software is part of the **[Open Lab Starter Kit (OLSK)](https://www.inmachines.net/open-lab-starter-kit)** group of open source digital fabrication machines.

OLSK is developed by **[InMachines Ingrassia GmbH](https://www.inmachines.net/)** for the **[Dtec project](https://dtecbw.de/home/forschung/hsu/projekt-fabcity)** at **[Fab City Hamburg](https://www.fabcity.hamburg/en/)**.

OLSK Partners:
<br><br>
<img src="https://irp.cdn-website.com/2b5ccdcd/dms3rep/multi/OLSK_partners.png" width="80%">

## Contact

- daniele@inmachines.net
- [https://www.inmachines.net/](https://www.inmachines.net/)

## License

This software is licensed under **[GNU General Public License v3.0](LICENSE.txt)**.
