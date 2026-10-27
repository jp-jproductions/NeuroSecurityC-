FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY dotnet/dotnet.csproj dotnet/
RUN dotnet restore dotnet/dotnet.csproj

COPY dotnet/ dotnet/
RUN dotnet publish dotnet/dotnet.csproj --configuration Release --no-restore --output /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app

COPY --from=build /app/publish/ ./
COPY data/db.json ./data/db.json

ENV ASPNETCORE_ENVIRONMENT=Production
ENV NEUROSECURITY_DB=/app/data/db.json
EXPOSE 80

ENTRYPOINT ["sh", "-c", "exec dotnet dotnet.dll --urls http://0.0.0.0:${PORT:-80}"]
