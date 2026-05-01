from flask import jsonify, request


def reject_direct_navigation():
    """
    Block direct browser navigation to API routes.
    Allow XHR/fetch requests from the frontend.
    """
    fetch_mode = (request.headers.get("Sec-Fetch-Mode") or "").lower()
    fetch_dest = (request.headers.get("Sec-Fetch-Dest") or "").lower()
    accept = (request.headers.get("Accept") or "").lower()

    is_navigation = fetch_mode == "navigate" or fetch_dest == "document"
    wants_html = "text/html" in accept

    if is_navigation or wants_html:
        return jsonify({"error": "Direct browsing not allowed"}), 403

    return None


def apply_navigation_guard(blueprint):
    @blueprint.before_request
    def _guard_navigation():
        return reject_direct_navigation()
