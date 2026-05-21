from __future__ import annotations

from typing import Any, Iterable

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import AuditLog, User


class AdminPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


def audit(actor: User | None, *, action: str, target_type: str, target_id: str = "", payload: dict | None = None) -> None:
    try:
        AuditLog.objects.create(
            actor=actor,
            actor_role=(getattr(actor, "role", "") or "").lower() if actor else "",
            action=action,
            target_type=target_type,
            target_id=str(target_id or ""),
            payload=payload or {},
        )
    except Exception:
        pass


def response_list(
    view: Any,
    *,
    qs: Any,
    serializer_class: Any,
    request: Any,
    serializer_context: dict | None = None,
) -> Response:
    page = view.paginate_queryset(qs)
    ctx = serializer_context or {"request": request}
    if page is not None:
        return view.get_paginated_response(serializer_class(page, many=True, context=ctx).data)
    data = serializer_class(qs, many=True, context=ctx).data
    return Response({"count": len(data), "next": None, "previous": None, "results": data})

