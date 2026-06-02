.. OLOS Server documentation master file, created by
   sphinx-quickstart on Tue Aug  5 11:53:21 2025.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.


OLOS Server's Documentation
=======================================

**OLOS Server** is the backend system powering the **Open Lab Operating System (OLOS)** a unified platform designed to manage and operate various open lab fabrication machines, including Laser Cutters, CNC machines, Vinyl Cutters, and Metal 3D Printers.

This server-side codebase handles communication between the OLOS frontend interface and physical machines, enabling task scheduling, job execution, machine monitoring, and user interaction. It serves as the central control point for coordinating safe, efficient, and user-friendly operation of diverse digital fabrication equipment in an open lab environment.

Getting Started
================

.. toctree::
   :maxdepth: 3

   readme

Source Code
============

.. toctree::
   :maxdepth: 3

   src

API Endpoints
==================
- `Swagger UI <http://localhost:8000/swagger>`_
- `ReDoc <http://localhost:8000/redoc>`_

Indices and Tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
