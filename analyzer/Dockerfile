FROM python:3.11-slim
WORKDIR /app
COPY requirements_light.txt ./
RUN pip install --timeout=1000 --retries=5 -r requirements_light.txt
COPY . .
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
