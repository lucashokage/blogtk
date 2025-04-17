/**
 * A utility function for making fetch requests with enhanced error handling,
 * timeout support, and automatic retries.
 */
export async function safeFetch(url: string, options: any = {}) {
  const { retries = 1, timeout = 10000, validateResponse, ...fetchOptions } = options

  let lastError: Error | null = null

  // Try the request up to retries + 1 times
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create an AbortController for this attempt
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Add the signal to the fetch options
      const requestOptions = {
        ...fetchOptions,
        signal: controller.signal,
      }

      // Make the request
      const response = await fetch(url, requestOptions)

      // Clear the timeout
      clearTimeout(timeoutId)

      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      // If a validation function is provided, use it to validate the response
      if (validateResponse && typeof validateResponse === "function") {
        const isValid = await validateResponse(response)
        if (!isValid) {
          throw new Error("Response validation failed")
        }
      }

      // Parse and return the JSON response
      return await response.clone().json()
    } catch (error: any) {
      lastError = error

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error
      }

      // Otherwise, wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
    }
  }

  // This should never be reached, but just in case
  throw lastError || new Error("Unknown error in safeFetch")
}
