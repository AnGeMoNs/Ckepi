"""Shared HTTP client factories with portable certifi CA bundle verification."""

import ssl
import certifi
import httpx


def _ssl_context() -> ssl.SSLContext:
    """Create an SSL context backed by certifi's CA bundle."""
    return ssl.create_default_context(cafile=certifi.where())


def create_http_client(timeout: float = 20.0) -> httpx.Client:
    """Return a synchronous httpx.Client verified against certifi's CA bundle."""
    return httpx.Client(timeout=timeout, verify=_ssl_context())


def create_async_http_client(timeout: float = 20.0) -> httpx.AsyncClient:
    """Return an async httpx.AsyncClient verified against certifi's CA bundle."""
    return httpx.AsyncClient(timeout=timeout, verify=_ssl_context())
