src.fastapi_server package
==========================

This package implements the REST API server for the system. It includes modules for:

- API routing
- Services (business logic)
- Models (data structures and validation)
- Server process management

The live API documentation for endpoints is available via:

- `Swagger UI <http://localhost:8000/swagger>`_
- `ReDoc <http://localhost:8000/redoc>`_

src.fastapi_server.main module
-------------------------------

.. automodule:: fastapi_server.main
   :members:
   :show-inheritance:
   :undoc-members:

src.fastapi_server.constants module
------------------------------------

.. automodule:: fastapi_server.constants
   :members:
   :show-inheritance:


Subpackages
-----------

.. toctree::
   :maxdepth: 2

   src.fastapi_server.api
   src.fastapi_server.services
   src.fastapi_server.models
