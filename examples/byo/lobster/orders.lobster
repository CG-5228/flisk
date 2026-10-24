// Runs once while the image is built and writes the files the container serves.
// Lobster has no network builtins, so it cannot be the HTTP server itself.
total := 0
for([3, 5, 8, 13]) x:
    total += x

body := "\{\"service\":\"lobster\",\"orders\":4,\"total\":" + total + "\}\n"
if not write_file("/site/www/orders.json", body, 0, 1):
    print("could not write /site/www/orders.json")
    return 1
if not write_file("/site/www/health", "ok\n", 0, 1):
    print("could not write /site/www/health")
    return 1
