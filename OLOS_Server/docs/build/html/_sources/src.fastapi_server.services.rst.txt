src.fastapi_server.services package
====================================

The ``src.fastapi_server.services`` contains service modules that act as intermediaries between the FastAPI server and the underlying core processing components. Each service module encapsulates specific business logic and communication via queues, enabling asynchronous and decoupled processing of tasks such as AI operations, job management, material library handling, media management, and 3D model slicing. The services abstract the details of inter-process communication and provide clear, reusable interfaces for the server endpoints.

src.fastapi_server.services.ai_service module
-----------------------------------------------

.. automodule:: fastapi_server.services.ai_service
   :members:
   :show-inheritance:
   :undoc-members:

src.fastapi_server.services.jobs_manager_service module
----------------------------------------------------------

.. automodule:: fastapi_server.services.jobs_manager_service
   :members:
   :show-inheritance:
   :undoc-members:

src.fastapi_server.services.material_library_service module
--------------------------------------------------------------

.. automodule:: fastapi_server.services.material_library_service
   :members:
   :show-inheritance:
   :undoc-members:

src.fastapi_server.services.media_manager_service module
-----------------------------------------------------------

.. automodule:: fastapi_server.services.media_manager_service
   :members:
   :show-inheritance:
   :undoc-members:

src.fastapi_server.services.slice_service module
--------------------------------------------------

.. automodule:: fastapi_server.services.slice_service
   :members:
   :show-inheritance:
   :undoc-members:

