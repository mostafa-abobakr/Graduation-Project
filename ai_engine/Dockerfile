FROM python:3.10-slim

# ---------------------------------------------------------------------------
# System dependencies:
#   build-essential                  — required by Prophet to compile C++ Stan models
#   curl/gnupg/apt-transport-https  — needed to add Microsoft's repo
#   libgomp1                         — required by Prophet (OpenMP)
#   msodbcsql18 + unixodbc-dev       — SQL Server ODBC driver
# ---------------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gnupg \
    apt-transport-https \
    libgomp1 \
    tesseract-ocr \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && curl -fsSL https://packages.microsoft.com/config/debian/12/prod.list \
    > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
    msodbcsql18 \
    unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ---------------------------------------------------------------------------
# Hugging Face Permissions Fix
# ---------------------------------------------------------------------------
# Hugging Face Spaces runs containers as a non-root user (uid 1000).
# If we run `pip install prophet` as root, it compiles its C++ 'cmdstan' 
# backend into /root/.cmdstan, which uid 1000 cannot access at runtime!
# FIX: Create a user and run all pip installations as that user.
RUN useradd -m -u 1000 user
RUN chown -R user:user /app
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Install Python dependencies (cached layer — only re-runs when requirements change)
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application source
COPY --chown=user:user . .

# Render injects $PORT at runtime. HuggingFace expects 7860.
ENV PORT=7860

EXPOSE ${PORT}

# Use shell form so $PORT is expanded at runtime
CMD uvicorn app:app --host 0.0.0.0 --port $PORT
