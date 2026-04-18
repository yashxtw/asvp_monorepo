FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8091

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc \
    && rm -rf /var/lib/apt/lists/*

COPY apps/ner-service/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

COPY apps/ner-service/ner_service.py ./ner_service.py

EXPOSE 8091

CMD ["sh", "-c", "uvicorn ner_service:app --host 0.0.0.0 --port ${PORT:-8091}"]
