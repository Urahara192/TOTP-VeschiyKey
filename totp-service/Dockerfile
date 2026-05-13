FROM golang:1.22-alpine AS build
WORKDIR /app
COPY . .
RUN go build -o /totp-service ./cmd/server

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=build /totp-service /
EXPOSE 9090
CMD ["/totp-service"]
