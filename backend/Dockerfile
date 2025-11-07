FROM python:3.12-slim

COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

WORKDIR /app

ENV PYTHONUNBUFFERED=1

RUN groupadd -r appgroup && useradd -r -s /bin/false -g appgroup appuser

COPY . .

RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]