FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY dotnet/dotnet.csproj dotnet/
RUN dotnet restore dotnet/dotnet.csproj
COPY dotnet/ dotnet/
COPY data/ data/
RUN dotnet publish dotnet/dotnet.csproj --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
COPY data/ data/
ENV ASPNETCORE_ENVIRONMENT=Production
ENV NEUROSECURITY_DB=/app/data/db.json
ENTRYPOINT ["dotnet", "dotnet.dll"]
